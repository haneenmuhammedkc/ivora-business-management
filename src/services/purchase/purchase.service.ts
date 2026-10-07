import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess } from "@/lib/auth/authorization";
import { AuthError } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, PurchaseStatus, QuantityUnit, UserRole } from "@prisma/client";
import { createPurchaseSchema, updatePurchaseSchema } from "@/validators/purchase.validator";

export interface CreatePurchaseInput {
  businessId: string;
  purchaseDate: string | Date;
  productType: string;
  quantity: number | string;
  quantityUnit?: QuantityUnit | "GRAM" | "PIECE" | "GRAMS" | "PIECES";
  baseAmount?: number | string;
  basePricePerUnitAED?: number | string | null;
  basePricePerGm?: number | string | null;
  purchaseCode?: string;
  sourcingVault?: string | null;
  tradingCycleId?: string | null;
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
    await requireBusinessAccess(businessId);
    return prisma.purchase.findMany({
      where: { businessId },
      include: { business: { select: { id: true, name: true, code: true } } },
      orderBy: { purchaseDate: "desc" },
    });
  }

  const where: Prisma.PurchaseWhereInput =
    session.role === UserRole.ADMIN
      ? {}
      : { business: { partnerId: session.userId } };

  return prisma.purchase.findMany({
    where,
    include: { business: { select: { id: true, name: true, code: true } } },
    orderBy: { purchaseDate: "desc" },
  });
}

export async function getPurchaseById(session: SessionPayload, purchaseId: string) {
  const { resource } = await requireResourceAccess("Purchase", purchaseId, "READ");
  return resource;
}

export async function createPurchase(session: SessionPayload, input: CreatePurchaseInput) {
  // 1. Zod Validation
  const validationResult = createPurchaseSchema.safeParse(input);
  if (!validationResult.success) {
    const firstIssue = validationResult.error.issues[0];
    throw new AuthError(firstIssue ? firstIssue.message : "Invalid purchase input data", 400);
  }
  const validated = validationResult.data;

  // 2. Business Existence Validation
  const business = await prisma.business.findUnique({
    where: { id: validated.businessId },
    select: { id: true, partnerId: true, name: true, code: true },
  });

  if (!business) {
    throw new AuthError("Business entity not found.", 404);
  }

  // 3. Authorization Check
  if (session.role === UserRole.PARTNER && business.partnerId !== session.userId) {
    await logAuditEvent({
      userId: session.userId,
      action: "UNAUTHORIZED_ACCESS_ATTEMPT",
      entity: "Purchase",
      entityId: validated.businessId,
      oldValues: { attemptedRole: session.role },
    });
    throw new AuthError("You do not have permission to access this business", 403);
  }

  // 4. Server-Side ID Generation
  const purchaseCode =
    input.purchaseCode && input.purchaseCode.trim()
      ? input.purchaseCode.trim()
      : await generateUniquePurchaseCode();

  // 5. Quantity & Unit Assignment
  const quantityDecimal = new Prisma.Decimal(validated.quantity);
  const quantityGms =
    validated.quantityUnit === QuantityUnit.GRAM ? quantityDecimal : null;

  // 6. Base Amount & Authoritative Total Purchase Amount Calculation (quantity × baseAmount)
  const effectiveBase = validated.baseAmount ?? validated.basePricePerUnitAED ?? validated.basePricePerGm;
  if (
    effectiveBase === undefined ||
    effectiveBase === null ||
    isNaN(Number(effectiveBase)) ||
    Number(effectiveBase) <= 0
  ) {
    throw new AuthError("Base amount must be a positive number greater than 0", 400);
  }

  const baseAmountDecimal = new Prisma.Decimal(effectiveBase);
  // Authoritative server-side calculation: totalPurchaseAmount = quantity × baseAmount
  const baseAcquisitionValueDecimal = quantityDecimal
    .mul(baseAmountDecimal)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  const basePricePerUnitAEDDecimal = baseAmountDecimal;
  const basePricePerGmDecimal =
    validated.quantityUnit === QuantityUnit.GRAM ? baseAmountDecimal : null;

  const tifDecimal = new Prisma.Decimal(input.transitInsuranceFreight ?? 0);
  const vhlDecimal = new Prisma.Decimal(input.vaultHandlingLabour ?? 0);
  const csDecimal = new Prisma.Decimal(input.customsSecurity ?? 0);

  const totalLandedCostDecimal = baseAcquisitionValueDecimal
    .add(tifDecimal)
    .add(vhlDecimal)
    .add(csDecimal)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  // 7. Persist to Database
  const purchase = await prisma.purchase.create({
    data: {
      businessId: validated.businessId,
      tradingCycleId: input.tradingCycleId || null,
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
      status: input.status || PurchaseStatus.DRAFT,
    },
    include: { business: { select: { id: true, name: true, code: true } } },
  });

  // 8. Audit Logging
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
    "WRITE"
  );

  const newQuantity =
    validated.quantity !== undefined
      ? new Prisma.Decimal(validated.quantity)
      : new Prisma.Decimal(existing.quantity);
  const newQuantityUnit = validated.quantityUnit || existing.quantityUnit;
  const quantityGms =
    newQuantityUnit === QuantityUnit.GRAM ? newQuantity : null;

  // Determine base amount
  const inputBase = validated.baseAmount ?? validated.basePricePerUnitAED ?? validated.basePricePerGm;
  let effectiveBaseDecimal: Prisma.Decimal | null = null;

  if (inputBase !== undefined && inputBase !== null) {
    effectiveBaseDecimal = new Prisma.Decimal(inputBase);
  } else if (existing.basePricePerUnitAED !== null) {
    effectiveBaseDecimal = new Prisma.Decimal(existing.basePricePerUnitAED);
  } else if (existing.basePricePerGm !== null) {
    effectiveBaseDecimal = new Prisma.Decimal(existing.basePricePerGm);
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

  let baseAcquisitionValue: Prisma.Decimal | null = null;
  let totalLandedCost: Prisma.Decimal | null = null;
  let basePricePerGm: Prisma.Decimal | null = null;
  let basePricePerUnitAED: Prisma.Decimal | null = null;

  if (effectiveBaseDecimal !== null) {
    basePricePerUnitAED = effectiveBaseDecimal;
    basePricePerGm = newQuantityUnit === QuantityUnit.GRAM ? effectiveBaseDecimal : null;
    // Authoritative calculation: quantity × baseAmount
    baseAcquisitionValue = newQuantity
      .mul(effectiveBaseDecimal)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    totalLandedCost = baseAcquisitionValue
      .add(tif)
      .add(vhl)
      .add(cs)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }

  // If businessId is changing, verify access to the destination business
  if (validated.businessId && validated.businessId !== existing.businessId) {
    await requireBusinessAccess(validated.businessId, session);
  }

  const updated = await prisma.purchase.update({
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

  return updated;
}

export async function clearPurchase(session: SessionPayload, purchaseId: string) {
  await requireResourceAccess("Purchase", purchaseId, "WRITE");

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

  return cleared;
}

export async function deletePurchase(session: SessionPayload, purchaseId: string) {
  await requireResourceAccess("Purchase", purchaseId, "DELETE");

  const deleted = await prisma.purchase.delete({
    where: { id: purchaseId },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "PURCHASE_DELETED",
    entity: "Purchase",
    entityId: deleted.id,
  });

  return { success: true };
}
