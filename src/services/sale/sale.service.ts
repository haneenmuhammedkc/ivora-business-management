import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, SaleStatus, UserRole } from "@prisma/client";

export interface CreateSaleInput {
  businessId: string;
  tradingCycleId?: string;
  saleCode: string;
  saleDate: string | Date;
  liquidationDesk: string;
  buyerFirm: string;
  productType: string;
  quantityGms: number;
  sellingPricePerGm: number;
  realizedFxRate: number;
  status?: SaleStatus;
}

export interface UpdateSaleInput {
  saleDate?: string | Date;
  liquidationDesk?: string;
  buyerFirm?: string;
  productType?: string;
  quantityGms?: number;
  sellingPricePerGm?: number;
  realizedFxRate?: number;
  status?: SaleStatus;
}

export async function listSales(session: SessionPayload, businessId?: string) {
  if (businessId) {
    await requireBusinessAccess(businessId);
    return prisma.sale.findMany({
      where: { businessId },
      include: { business: { select: { id: true, name: true, code: true } } },
      orderBy: { saleDate: "desc" },
    });
  }

  const where: Prisma.SaleWhereInput =
    session.role === UserRole.ADMIN
      ? {}
      : { business: { partnerId: session.userId } };

  return prisma.sale.findMany({
    where,
    include: { business: { select: { id: true, name: true, code: true } } },
    orderBy: { saleDate: "desc" },
  });
}

export async function getSaleById(session: SessionPayload, saleId: string) {
  const { resource } = await requireResourceAccess("Sale", saleId, "READ");
  return resource;
}

export async function createSale(session: SessionPayload, input: CreateSaleInput) {
  await requireBusinessAccess(input.businessId);

  const inrRealizationValue = Number(input.quantityGms) * Number(input.sellingPricePerGm);
  const aedEquivalent = inrRealizationValue / Number(input.realizedFxRate);

  const sale = await prisma.sale.create({
    data: {
      businessId: input.businessId,
      tradingCycleId: input.tradingCycleId || null,
      saleCode: input.saleCode.trim(),
      saleDate: new Date(input.saleDate),
      liquidationDesk: input.liquidationDesk.trim(),
      buyerFirm: input.buyerFirm.trim(),
      productType: input.productType.trim(),
      quantityGms: new Prisma.Decimal(input.quantityGms),
      sellingPricePerGm: new Prisma.Decimal(input.sellingPricePerGm),
      inrRealizationValue: new Prisma.Decimal(inrRealizationValue),
      realizedFxRate: new Prisma.Decimal(input.realizedFxRate),
      aedEquivalent: new Prisma.Decimal(aedEquivalent),
      status: input.status || SaleStatus.PENDING,
    },
    include: { business: { select: { id: true, name: true, code: true } } },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "SALE_CREATED",
    entity: "Sale",
    entityId: sale.id,
    newValues: { code: sale.saleCode, businessId: input.businessId, aedEquivalent },
  });

  return sale;
}

export async function updateSale(session: SessionPayload, saleId: string, input: UpdateSaleInput) {
  const { resource: existing } = await requireResourceAccess<Prisma.SaleGetPayload<Record<string, never>>>(
    "Sale",
    saleId,
    "WRITE"
  );

  const quantityGms = input.quantityGms !== undefined ? Number(input.quantityGms) : Number(existing.quantityGms);
  const sellingPricePerGm = input.sellingPricePerGm !== undefined ? Number(input.sellingPricePerGm) : Number(existing.sellingPricePerGm);
  const realizedFxRate = input.realizedFxRate !== undefined ? Number(input.realizedFxRate) : Number(existing.realizedFxRate);

  const inrRealizationValue = quantityGms * sellingPricePerGm;
  const aedEquivalent = inrRealizationValue / realizedFxRate;

  const updated = await prisma.sale.update({
    where: { id: saleId },
    data: {
      saleDate: input.saleDate ? new Date(input.saleDate) : undefined,
      liquidationDesk: input.liquidationDesk?.trim(),
      buyerFirm: input.buyerFirm?.trim(),
      productType: input.productType?.trim(),
      quantityGms: input.quantityGms !== undefined ? new Prisma.Decimal(quantityGms) : undefined,
      sellingPricePerGm: input.sellingPricePerGm !== undefined ? new Prisma.Decimal(sellingPricePerGm) : undefined,
      inrRealizationValue: new Prisma.Decimal(inrRealizationValue),
      realizedFxRate: new Prisma.Decimal(realizedFxRate),
      aedEquivalent: new Prisma.Decimal(aedEquivalent),
      status: input.status,
    },
    include: { business: { select: { id: true, name: true, code: true } } },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "SALE_UPDATED",
    entity: "Sale",
    entityId: updated.id,
    newValues: { status: updated.status, aedEquivalent },
  });

  return updated;
}

export async function clearSale(session: SessionPayload, saleId: string) {
  await requireResourceAccess("Sale", saleId, "WRITE");

  const cleared = await prisma.sale.update({
    where: { id: saleId },
    data: { status: SaleStatus.CLEARED },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "SALE_CLEARED_LOCKED",
    entity: "Sale",
    entityId: cleared.id,
  });

  return cleared;
}

export async function deleteSale(session: SessionPayload, saleId: string) {
  await requireResourceAccess("Sale", saleId, "DELETE");

  const deleted = await prisma.sale.delete({
    where: { id: saleId },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "SALE_DELETED",
    entity: "Sale",
    entityId: deleted.id,
  });

  return { success: true };
}
