import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess } from "@/lib/auth/authorization";
import { AuthError } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, PurchaseStatus, QuantityUnit, UserRole } from "@prisma/client";
import { createPurchaseSchema } from "@/validators/purchase.validator";

export interface CreatePurchaseInput {
  businessId: string;
  purchaseDate: string | Date;
  productType: string;
  quantity: number | string;
  quantityUnit?: QuantityUnit | "GRAM" | "PIECE" | "GRAMS" | "PIECES";
  purchaseCode?: string;
  sourcingVault?: string | null;
  tradingCycleId?: string | null;
  basePricePerGm?: number | null;
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
  quantityUnit?: QuantityUnit;
  quantityGms?: number | null;
  basePricePerGm?: number | null;
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

  // 6. Optional Financial Fields Handling (Do not invent financial values)
  let basePricePerGmDecimal: Prisma.Decimal | null = null;
  let baseAcquisitionValueDecimal: Prisma.Decimal | null = null;
  let tifDecimal: Prisma.Decimal | null = null;
  let vhlDecimal: Prisma.Decimal | null = null;
  let csDecimal: Prisma.Decimal | null = null;
  let totalLandedCostDecimal: Prisma.Decimal | null = null;

  if (input.basePricePerGm !== undefined && input.basePricePerGm !== null) {
    const basePriceNum = Number(input.basePricePerGm);
    if (!isNaN(basePriceNum) && basePriceNum > 0) {
      basePricePerGmDecimal = new Prisma.Decimal(basePriceNum);
      const baseAcq = Number(validated.quantity) * basePriceNum;
      baseAcquisitionValueDecimal = new Prisma.Decimal(baseAcq);

      const tif = Number(input.transitInsuranceFreight || 0);
      const vhl = Number(input.vaultHandlingLabour || 0);
      const cs = Number(input.customsSecurity || 0);

      tifDecimal = new Prisma.Decimal(tif);
      vhlDecimal = new Prisma.Decimal(vhl);
      csDecimal = new Prisma.Decimal(cs);
      totalLandedCostDecimal = new Prisma.Decimal(baseAcq + tif + vhl + cs);
    }
  }

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
    },
  });

  return purchase;
}

export async function updatePurchase(session: SessionPayload, purchaseId: string, input: UpdatePurchaseInput) {
  const { resource: existing } = await requireResourceAccess<Prisma.PurchaseGetPayload<Record<string, never>>>(
    "Purchase",
    purchaseId,
    "WRITE"
  );

  const newQuantity =
    input.quantity !== undefined ? Number(input.quantity) : Number(existing.quantity);
  const newQuantityUnit = input.quantityUnit || existing.quantityUnit;
  const quantityGms =
    newQuantityUnit === QuantityUnit.GRAM ? new Prisma.Decimal(newQuantity) : null;

  // Preserve financial calculations if financial values are already present or being updated
  const basePricePerGm =
    input.basePricePerGm !== undefined
      ? input.basePricePerGm !== null
        ? Number(input.basePricePerGm)
        : null
      : existing.basePricePerGm !== null
      ? Number(existing.basePricePerGm)
      : null;

  const tif =
    input.transitInsuranceFreight !== undefined
      ? input.transitInsuranceFreight !== null
        ? Number(input.transitInsuranceFreight)
        : null
      : existing.transitInsuranceFreight !== null
      ? Number(existing.transitInsuranceFreight)
      : null;

  const vhl =
    input.vaultHandlingLabour !== undefined
      ? input.vaultHandlingLabour !== null
        ? Number(input.vaultHandlingLabour)
        : null
      : existing.vaultHandlingLabour !== null
      ? Number(existing.vaultHandlingLabour)
      : null;

  const cs =
    input.customsSecurity !== undefined
      ? input.customsSecurity !== null
        ? Number(input.customsSecurity)
        : null
      : existing.customsSecurity !== null
      ? Number(existing.customsSecurity)
      : null;

  let baseAcquisitionValue: Prisma.Decimal | null = null;
  let totalLandedCost: Prisma.Decimal | null = null;

  if (basePricePerGm !== null) {
    const baseVal = newQuantity * basePricePerGm;
    baseAcquisitionValue = new Prisma.Decimal(baseVal);
    const landed = baseVal + (tif || 0) + (vhl || 0) + (cs || 0);
    totalLandedCost = new Prisma.Decimal(landed);
  }

  // If businessId is changing, verify access to the destination business
  if (input.businessId && input.businessId !== existing.businessId) {
    await requireBusinessAccess(input.businessId, session);
  }

  const updated = await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      businessId: input.businessId || undefined,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      sourcingVault: input.sourcingVault !== undefined ? input.sourcingVault?.trim() || null : undefined,
      productType: input.productType?.trim(),
      quantity: input.quantity !== undefined ? new Prisma.Decimal(newQuantity) : undefined,
      quantityUnit: input.quantityUnit || undefined,
      quantityGms,
      basePricePerGm: basePricePerGm !== null ? new Prisma.Decimal(basePricePerGm) : null,
      baseAcquisitionValue,
      transitInsuranceFreight: tif !== null ? new Prisma.Decimal(tif) : null,
      vaultHandlingLabour: vhl !== null ? new Prisma.Decimal(vhl) : null,
      customsSecurity: cs !== null ? new Prisma.Decimal(cs) : null,
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
    newValues: { status: updated.status, totalLandedCost: updated.totalLandedCost ? Number(updated.totalLandedCost) : null },
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
