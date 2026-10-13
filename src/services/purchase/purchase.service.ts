import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess } from "@/lib/auth/authorization";
import { AuthError } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, PurchaseStatus, QuantityUnit, UserRole } from "@prisma/client";
import { createPurchaseSchema, updatePurchaseSchema } from "@/validators/purchase.validator";
import { getOrSetCache } from "@/lib/redis/cache";
import { CacheKeys, CacheTTL } from "@/lib/redis/keys";
import { invalidateTransactionCaches } from "@/lib/redis/invalidation";
import { reconcileInventory } from "@/services/sale/sale.service";

export interface CreatePurchaseInput {
  businessId: string;
  purchaseDate: string | Date;
  productType: string;
  quantity: number | string;
  quantityUnit?: QuantityUnit | "GRAM" | "PIECE" | "GRAMS" | "PIECES";
  totalPurchaseAmount?: number | string;
  baseAcquisitionValue?: number | string;
  baseAmount?: number | string;
  basePricePerUnitAED?: number | string | null;
  basePricePerGm?: number | string | null;
  purchaseCode?: string;
  sourcingVault?: string | null;
  transitInsuranceFreight?: number | null;
  vaultHandlingLabour?: number | null;
  customsSecurity?: number | null;
  status?: PurchaseStatus;
}

export interface UpdatePurchaseInput {
  businessId?: string;
  purchaseDate?: string | Date;
  sourcingVault?: string | null;
  productType?: string;
  quantity?: number | string;
  quantityUnit?: QuantityUnit | "GRAM" | "PIECE" | "GRAMS" | "PIECES";
  quantityGms?: number | null;
  totalPurchaseAmount?: number | string;
  baseAcquisitionValue?: number | string;
  baseAmount?: number | string;
  basePricePerUnitAED?: number | string | null;
  basePricePerGm?: number | string | null;
  transitInsuranceFreight?: number | null;
  vaultHandlingLabour?: number | null;
  customsSecurity?: number | null;
  status?: PurchaseStatus;
}

/**
 * Generate a unique sequential purchase code, e.g. PR-0001, PR-0249.
 */
export async function generateUniquePurchaseCode(): Promise<string> {
  const latest = await prisma.purchase.findFirst({
    orderBy: { createdAt: "desc" },
    select: { purchaseCode: true },
  });

  let nextNum = 1;
  if (latest?.purchaseCode) {
    const match = latest.purchaseCode.match(/\bPR-(\d+)\b/i);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    } else {
      const count = await prisma.purchase.count();
      nextNum = count + 1;
    }
  }

  let code = `PR-${String(nextNum).padStart(4, "0")}`;
  let attempt = 0;
  while (await prisma.purchase.findUnique({ where: { purchaseCode: code } })) {
    nextNum++;
    code = `PR-${String(nextNum).padStart(4, "0")}`;
    attempt++;
    if (attempt > 100) break;
  }

  return code;
}

export async function listPurchases(session: SessionPayload, businessId?: string) {
  if (businessId) {
    await requireBusinessAccess(businessId, session);
    const cacheKey = CacheKeys.purchases.list(businessId);
    return getOrSetCache(cacheKey, CacheTTL.MEDIUM, () =>
      prisma.purchase.findMany({
        where: { businessId },
        include: { business: { select: { id: true, name: true, code: true } } },
        orderBy: { purchaseDate: "desc" },
      })
    );
  }

  const cacheKey = CacheKeys.purchases.list(undefined, session.role, session.userId);
  const where: Prisma.PurchaseWhereInput =
    session.role === UserRole.ADMIN
      ? {}
      : { business: { partnerId: session.userId } };

  return getOrSetCache(cacheKey, CacheTTL.MEDIUM, () =>
    prisma.purchase.findMany({
      where,
      include: { business: { select: { id: true, name: true, code: true } } },
      orderBy: { purchaseDate: "desc" },
    })
  );
}

export async function getPurchaseById(session: SessionPayload, purchaseId: string) {
  const { resource } = await requireResourceAccess("Purchase", purchaseId, "READ", session);
  return resource;
}

/**
 * Calculates authoritative business purchase capacity.
 * Remaining Capacity = Business.totalInvestmentAED - sum(valid purchases)
 * Valid purchases: status IN [CLEARED, IN_PROGRESS]
 */
export async function getBusinessPurchaseCapacity(
  tx: Prisma.TransactionClient,
  businessId: string,
  excludePurchaseId?: string
): Promise<{
  business: { id: string; name: string; code: string; totalInvestmentAED: Prisma.Decimal };
  totalInvestment: Prisma.Decimal;
  existingPurchaseCost: Prisma.Decimal;
  remainingPurchaseCapacity: Prisma.Decimal;
}> {
  const business = await tx.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      code: true,
      totalInvestmentAED: true,
    },
  });

  if (!business) {
    throw new AuthError("Business entity not found.", 404);
  }

  const validPurchases = await tx.purchase.findMany({
    where: {
      businessId,
      id: excludePurchaseId ? { not: excludePurchaseId } : undefined,
      status: { in: [PurchaseStatus.CLEARED, PurchaseStatus.IN_PROGRESS] },
    },
    select: {
      totalLandedCost: true,
      baseAcquisitionValue: true,
    },
  });

  const existingPurchaseCost = validPurchases.reduce((acc, p) => {
    const cost = p.totalLandedCost ?? p.baseAcquisitionValue ?? 0;
    return acc.plus(new Prisma.Decimal(cost));
  }, new Prisma.Decimal(0));

  const totalInvestment = new Prisma.Decimal(business.totalInvestmentAED || 0);
  const remainingPurchaseCapacity = totalInvestment.minus(existingPurchaseCost);

  return {
    business: {
      id: business.id,
      name: business.name,
      code: business.code,
      totalInvestmentAED: totalInvestment,
    },
    totalInvestment,
    existingPurchaseCost,
    remainingPurchaseCapacity,
  };
}

export async function createPurchase(session: SessionPayload, input: CreatePurchaseInput) {
  // 1. Zod Validation
  const validationResult = createPurchaseSchema.safeParse(input);
  if (!validationResult.success) {
    const firstIssue = validationResult.error.issues[0];
    throw new AuthError(firstIssue ? firstIssue.message : "Invalid purchase input data", 400);
  }
  const validated = validationResult.data;

  // 2. Business Existence & Authorization Check
  await requireBusinessAccess(validated.businessId, session, "WRITE");

  // 3. Server-Side ID Generation
  const purchaseCode =
    input.purchaseCode && input.purchaseCode.trim()
      ? input.purchaseCode.trim()
      : await generateUniquePurchaseCode();

  // 4. Quantity & Unit Assignment
  const quantityDecimal = new Prisma.Decimal(validated.quantity);
  const quantityGms =
    validated.quantityUnit === QuantityUnit.GRAM ? quantityDecimal : null;

  // 5. Total Purchase Amount & Authoritative Base Amount Calculation
  const inputTotal = validated.totalPurchaseAmount ?? validated.baseAcquisitionValue;
  if (
    inputTotal === undefined ||
    inputTotal === null ||
    isNaN(Number(inputTotal)) ||
    Number(inputTotal) <= 0
  ) {
    throw new AuthError("Total purchase amount must be a positive number greater than 0", 400);
  }

  const baseAcquisitionValueDecimal = new Prisma.Decimal(inputTotal).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP
  );

  const basePricePerUnitAEDDecimal = baseAcquisitionValueDecimal
    .div(quantityDecimal)
    .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

  const basePricePerGmDecimal =
    validated.quantityUnit === QuantityUnit.GRAM ? basePricePerUnitAEDDecimal : null;

  const tifDecimal = new Prisma.Decimal(input.transitInsuranceFreight ?? 0);
  const vhlDecimal = new Prisma.Decimal(input.vaultHandlingLabour ?? 0);
  const csDecimal = new Prisma.Decimal(input.customsSecurity ?? 0);

  const totalLandedCostDecimal = baseAcquisitionValueDecimal
    .add(tifDecimal)
    .add(vhlDecimal)
    .add(csDecimal)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  const effectiveStatus = input.status || PurchaseStatus.CLEARED;

  // 6. Atomic Concurrency Lock, Capital Limit Validation & Database Persistence
  const purchase = await prisma.$transaction(async (tx) => {
    // Concurrency Lock on Business row
    await tx.$queryRaw`
      SELECT id FROM "Business" WHERE id = ${validated.businessId} FOR UPDATE
    `;

    // Calculate authoritative purchase capacity
    const { totalInvestment, existingPurchaseCost, remainingPurchaseCapacity } =
      await getBusinessPurchaseCapacity(tx, validated.businessId);

    // Enforce business purchase capital limit for committed purchases
    if (effectiveStatus !== PurchaseStatus.DRAFT) {
      if (totalLandedCostDecimal.greaterThan(remainingPurchaseCapacity)) {
        const remainingNum = Math.max(0, Number(remainingPurchaseCapacity.toFixed(2)));
        throw new AuthError(
          "Purchase amount exceeds the remaining business investment capacity.",
          400,
          {
            totalInvestment: Number(totalInvestment.toFixed(2)),
            existingPurchaseCost: Number(existingPurchaseCost.toFixed(2)),
            remainingPurchaseCapacity: remainingNum,
            requestedPurchaseCost: Number(totalLandedCostDecimal.toFixed(2)),
          }
        );
      }
    }

    const created = await tx.purchase.create({
      data: {
        businessId: validated.businessId,
        purchaseCode,
        purchaseDate: new Date(validated.purchaseDate),
        sourcingVault: input.sourcingVault?.trim() || null,
        productType: validated.productType.trim(),
        quantity: quantityDecimal,
        quantityUnit: validated.quantityUnit,
        quantityGms,
        basePricePerUnitAED: basePricePerUnitAEDDecimal,
        basePricePerGm: basePricePerGmDecimal,
        baseAcquisitionValue: baseAcquisitionValueDecimal,
        transitInsuranceFreight: tifDecimal,
        vaultHandlingLabour: vhlDecimal,
        customsSecurity: csDecimal,
        totalLandedCost: totalLandedCostDecimal,
        status: effectiveStatus,
      },
      include: { business: { select: { id: true, name: true, code: true } } },
    });

    await reconcileInventory(tx, created.businessId, created.productType, created.quantityUnit);

    return created;
  });

  // 7. Audit Logging
  await logAuditEvent({
    userId: session.userId,
    action: "PURCHASE_CREATED",
    entity: "Purchase",
    entityId: purchase.id,
    newValues: {
      code: purchase.purchaseCode,
      businessId: purchase.businessId,
      productType: purchase.productType,
      quantity: Number(purchase.quantity),
      quantityUnit: purchase.quantityUnit,
      basePricePerUnitAED: purchase.basePricePerUnitAED ? Number(purchase.basePricePerUnitAED) : null,
      baseAcquisitionValue: purchase.baseAcquisitionValue ? Number(purchase.baseAcquisitionValue) : null,
      totalLandedCost: purchase.totalLandedCost ? Number(purchase.totalLandedCost) : null,
    },
  });

  // 8. Invalidate Redis caches
  await invalidateTransactionCaches(purchase.businessId, "purchases", purchase.id);

  return purchase;
}

export async function updatePurchase(session: SessionPayload, purchaseId: string, input: UpdatePurchaseInput) {
  // 1. Zod Validation for update
  const validationResult = updatePurchaseSchema.safeParse(input);
  if (!validationResult.success) {
    const firstIssue = validationResult.error.issues[0];
    throw new AuthError(firstIssue ? firstIssue.message : "Invalid purchase input data", 400);
  }
  const validated = validationResult.data;

  // 2. Resource access & financial immutability check
  const { resource: existing } = await requireResourceAccess<Prisma.PurchaseGetPayload<Record<string, never>>>(
    "Purchase",
    purchaseId,
    "WRITE",
    session
  );

  const targetBusinessId = validated.businessId || existing.businessId;
  if (validated.businessId && validated.businessId !== existing.businessId) {
    await requireBusinessAccess(validated.businessId, session, "WRITE");
  }

  const newQuantity =
    validated.quantity !== undefined
      ? new Prisma.Decimal(validated.quantity)
      : new Prisma.Decimal(existing.quantity);
  const newQuantityUnit = validated.quantityUnit || existing.quantityUnit;
  const quantityGms =
    newQuantityUnit === QuantityUnit.GRAM ? newQuantity : null;

  // Determine Total Purchase Amount
  const inputTotal = validated.totalPurchaseAmount ?? validated.baseAcquisitionValue;
  let baseAcquisitionValue: Prisma.Decimal | null = null;
  let basePricePerUnitAED: Prisma.Decimal | null = null;
  let basePricePerGm: Prisma.Decimal | null = null;

  if (inputTotal !== undefined && inputTotal !== null) {
    baseAcquisitionValue = new Prisma.Decimal(inputTotal).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
  } else if (existing.baseAcquisitionValue !== null) {
    baseAcquisitionValue = new Prisma.Decimal(existing.baseAcquisitionValue);
  }

  if (baseAcquisitionValue !== null && !newQuantity.isZero()) {
    basePricePerUnitAED = baseAcquisitionValue
      .div(newQuantity)
      .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    basePricePerGm = newQuantityUnit === QuantityUnit.GRAM ? basePricePerUnitAED : null;
  }

  const tif =
    input.transitInsuranceFreight !== undefined && input.transitInsuranceFreight !== null
      ? new Prisma.Decimal(input.transitInsuranceFreight)
      : existing.transitInsuranceFreight !== null
      ? new Prisma.Decimal(existing.transitInsuranceFreight)
      : new Prisma.Decimal(0);

  const vhl =
    input.vaultHandlingLabour !== undefined && input.vaultHandlingLabour !== null
      ? new Prisma.Decimal(input.vaultHandlingLabour)
      : existing.vaultHandlingLabour !== null
      ? new Prisma.Decimal(existing.vaultHandlingLabour)
      : new Prisma.Decimal(0);

  const cs =
    input.customsSecurity !== undefined && input.customsSecurity !== null
      ? new Prisma.Decimal(input.customsSecurity)
      : existing.customsSecurity !== null
      ? new Prisma.Decimal(existing.customsSecurity)
      : new Prisma.Decimal(0);

  let totalLandedCost: Prisma.Decimal | null = null;
  if (baseAcquisitionValue !== null) {
    totalLandedCost = baseAcquisitionValue
      .add(tif)
      .add(vhl)
      .add(cs)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  } else if (existing.totalLandedCost !== null) {
    totalLandedCost = new Prisma.Decimal(existing.totalLandedCost);
  }

  const effectiveStatus = input.status !== undefined ? input.status : existing.status;

  // 3. Atomic Concurrency Lock, Capital Limit Validation & Database Persistence
  const updated = await prisma.$transaction(async (tx) => {
    // Concurrency Lock on Business row
    await tx.$queryRaw`
      SELECT id FROM "Business" WHERE id = ${targetBusinessId} FOR UPDATE
    `;

    // Calculate authoritative purchase capacity excluding current purchase being edited
    const { totalInvestment, existingPurchaseCost, remainingPurchaseCapacity } =
      await getBusinessPurchaseCapacity(tx, targetBusinessId, purchaseId);

    // Enforce business purchase capital limit for committed purchases
    if (effectiveStatus !== PurchaseStatus.DRAFT && totalLandedCost !== null) {
      if (totalLandedCost.greaterThan(remainingPurchaseCapacity)) {
        const remainingNum = Math.max(0, Number(remainingPurchaseCapacity.toFixed(2)));
        throw new AuthError(
          "Purchase amount exceeds the remaining business investment capacity.",
          400,
          {
            totalInvestment: Number(totalInvestment.toFixed(2)),
            existingPurchaseCost: Number(existingPurchaseCost.toFixed(2)),
            remainingPurchaseCapacity: remainingNum,
            requestedPurchaseCost: Number(totalLandedCost.toFixed(2)),
          }
        );
      }
    }

    const res = await tx.purchase.update({
      where: { id: purchaseId },
      data: {
        businessId: validated.businessId || undefined,
        purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : undefined,
        sourcingVault: input.sourcingVault !== undefined ? input.sourcingVault?.trim() || null : undefined,
        productType: validated.productType?.trim(),
        quantity: validated.quantity !== undefined ? newQuantity : undefined,
        quantityUnit: validated.quantityUnit || undefined,
        quantityGms,
        basePricePerUnitAED,
        basePricePerGm,
        baseAcquisitionValue,
        transitInsuranceFreight: tif,
        vaultHandlingLabour: vhl,
        customsSecurity: cs,
        totalLandedCost,
        status: input.status,
      },
      include: { business: { select: { id: true, name: true, code: true } } },
    });

    await reconcileInventory(tx, res.businessId, res.productType, res.quantityUnit);
    if (
      existing.businessId !== res.businessId ||
      existing.productType !== res.productType ||
      existing.quantityUnit !== res.quantityUnit
    ) {
      await reconcileInventory(tx, existing.businessId, existing.productType, existing.quantityUnit);
    }

    return res;
  });

  await logAuditEvent({
    userId: session.userId,
    action: "PURCHASE_UPDATED",
    entity: "Purchase",
    entityId: updated.id,
    newValues: {
      status: updated.status,
      basePricePerUnitAED: updated.basePricePerUnitAED ? Number(updated.basePricePerUnitAED) : null,
      baseAcquisitionValue: updated.baseAcquisitionValue ? Number(updated.baseAcquisitionValue) : null,
      totalLandedCost: updated.totalLandedCost ? Number(updated.totalLandedCost) : null,
    },
  });

  // Invalidate Redis caches
  await invalidateTransactionCaches(updated.businessId, "purchases", updated.id);
  if (existing.businessId && existing.businessId !== updated.businessId) {
    await invalidateTransactionCaches(existing.businessId, "purchases", updated.id);
  }

  return updated;
}

export async function clearPurchase(session: SessionPayload, purchaseId: string) {
  await requireResourceAccess("Purchase", purchaseId, "WRITE", session);

  const cleared = await prisma.purchase.update({
    where: { id: purchaseId },
    data: { status: PurchaseStatus.CLEARED },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "PURCHASE_CLEARED_LOCKED",
    entity: "Purchase",
    entityId: cleared.id,
  });

  // Invalidate Redis caches
  await invalidateTransactionCaches(cleared.businessId, "purchases", cleared.id);

  return cleared;
}

export async function deletePurchase(session: SessionPayload, purchaseId: string) {
  const { resource: existing } = await requireResourceAccess<Prisma.PurchaseGetPayload<Record<string, never>>>(
    "Purchase",
    purchaseId,
    "DELETE",
    session
  );

  const deleted = await prisma.purchase.delete({
    where: { id: purchaseId },
  });

  await reconcileInventory(prisma, existing.businessId, existing.productType, existing.quantityUnit);

  await logAuditEvent({
    userId: session.userId,
    action: "PURCHASE_DELETED",
    entity: "Purchase",
    entityId: deleted.id,
  });

  // Invalidate Redis caches
  await invalidateTransactionCaches(existing.businessId, "purchases", deleted.id);

  return { success: true };
}
