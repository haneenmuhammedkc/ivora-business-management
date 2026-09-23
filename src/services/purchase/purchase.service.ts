import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, PurchaseStatus, UserRole } from "@prisma/client";

export interface CreatePurchaseInput {
  businessId: string;
  tradingCycleId?: string;
  purchaseCode: string;
  purchaseDate: string | Date;
  sourcingVault: string;
  productType: string;
  quantityGms: number;
  basePricePerGm: number;
  transitInsuranceFreight?: number;
  vaultHandlingLabour?: number;
  customsSecurity?: number;
  status?: PurchaseStatus;
}

export interface UpdatePurchaseInput {
  purchaseDate?: string | Date;
  sourcingVault?: string;
  productType?: string;
  quantityGms?: number;
  basePricePerGm?: number;
  transitInsuranceFreight?: number;
  vaultHandlingLabour?: number;
  customsSecurity?: number;
  status?: PurchaseStatus;
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
  await requireBusinessAccess(input.businessId);

  const baseAcquisitionValue = Number(input.quantityGms) * Number(input.basePricePerGm);
  const tif = Number(input.transitInsuranceFreight || 0);
  const vhl = Number(input.vaultHandlingLabour || 0);
  const cs = Number(input.customsSecurity || 0);
  const totalLandedCost = baseAcquisitionValue + tif + vhl + cs;

  const purchase = await prisma.purchase.create({
    data: {
      businessId: input.businessId,
      tradingCycleId: input.tradingCycleId || null,
      purchaseCode: input.purchaseCode.trim(),
      purchaseDate: new Date(input.purchaseDate),
      sourcingVault: input.sourcingVault.trim(),
      productType: input.productType.trim(),
      quantityGms: new Prisma.Decimal(input.quantityGms),
      basePricePerGm: new Prisma.Decimal(input.basePricePerGm),
      baseAcquisitionValue: new Prisma.Decimal(baseAcquisitionValue),
      transitInsuranceFreight: new Prisma.Decimal(tif),
      vaultHandlingLabour: new Prisma.Decimal(vhl),
      customsSecurity: new Prisma.Decimal(cs),
      totalLandedCost: new Prisma.Decimal(totalLandedCost),
      status: input.status || PurchaseStatus.DRAFT,
    },
    include: { business: { select: { id: true, name: true, code: true } } },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "PURCHASE_CREATED",
    entity: "Purchase",
    entityId: purchase.id,
    newValues: { code: purchase.purchaseCode, businessId: input.businessId, totalLandedCost },
  });

  return purchase;
}

export async function updatePurchase(session: SessionPayload, purchaseId: string, input: UpdatePurchaseInput) {
  const { resource: existing } = await requireResourceAccess<Prisma.PurchaseGetPayload<Record<string, never>>>(
    "Purchase",
    purchaseId,
    "WRITE"
  );

  const quantityGms = input.quantityGms !== undefined ? Number(input.quantityGms) : Number(existing.quantityGms);
  const basePricePerGm = input.basePricePerGm !== undefined ? Number(input.basePricePerGm) : Number(existing.basePricePerGm);
  const tif = input.transitInsuranceFreight !== undefined ? Number(input.transitInsuranceFreight) : Number(existing.transitInsuranceFreight);
  const vhl = input.vaultHandlingLabour !== undefined ? Number(input.vaultHandlingLabour) : Number(existing.vaultHandlingLabour);
  const cs = input.customsSecurity !== undefined ? Number(input.customsSecurity) : Number(existing.customsSecurity);

  const baseAcquisitionValue = quantityGms * basePricePerGm;
  const totalLandedCost = baseAcquisitionValue + tif + vhl + cs;

  const updated = await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      sourcingVault: input.sourcingVault?.trim(),
      productType: input.productType?.trim(),
      quantityGms: input.quantityGms !== undefined ? new Prisma.Decimal(quantityGms) : undefined,
      basePricePerGm: input.basePricePerGm !== undefined ? new Prisma.Decimal(basePricePerGm) : undefined,
      baseAcquisitionValue: new Prisma.Decimal(baseAcquisitionValue),
      transitInsuranceFreight: new Prisma.Decimal(tif),
      vaultHandlingLabour: new Prisma.Decimal(vhl),
      customsSecurity: new Prisma.Decimal(cs),
      totalLandedCost: new Prisma.Decimal(totalLandedCost),
      status: input.status,
    },
    include: { business: { select: { id: true, name: true, code: true } } },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "PURCHASE_UPDATED",
    entity: "Purchase",
    entityId: updated.id,
    newValues: { status: updated.status, totalLandedCost },
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
