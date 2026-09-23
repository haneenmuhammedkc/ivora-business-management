import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, TradingCycleStatus, UserRole } from "@prisma/client";

export interface CreateTradingCycleInput {
  businessId: string;
  cycleCode: string;
  startDate: string | Date;
  status?: TradingCycleStatus;
}

export interface UpdateTradingCycleInput {
  startDate?: string | Date;
  completionDate?: string | Date | null;
  grossRealizationAed?: number;
  purchaseLandedCostAed?: number;
  directExpensesAed?: number;
  grossArbitrageSpreadAed?: number;
  netProfitAed?: number;
  investorShareTotalAed?: number;
  deskRetainedProfitAed?: number;
  status?: TradingCycleStatus;
}

export async function listTradingCycles(session: SessionPayload, businessId?: string) {
  if (businessId) {
    await requireBusinessAccess(businessId);
    return prisma.tradingCycle.findMany({
      where: { businessId },
      include: {
        business: { select: { id: true, name: true, code: true } },
        purchase: { select: { id: true, purchaseCode: true, status: true } },
        sale: { select: { id: true, saleCode: true, status: true } },
      },
      orderBy: { startDate: "desc" },
    });
  }

  const where: Prisma.TradingCycleWhereInput =
    session.role === UserRole.ADMIN
      ? {}
      : { business: { partnerId: session.userId } };

  return prisma.tradingCycle.findMany({
    where,
    include: {
      business: { select: { id: true, name: true, code: true } },
      purchase: { select: { id: true, purchaseCode: true, status: true } },
      sale: { select: { id: true, saleCode: true, status: true } },
    },
    orderBy: { startDate: "desc" },
  });
}

export async function getTradingCycleById(session: SessionPayload, cycleId: string) {
  const { resource } = await requireResourceAccess("TradingCycle", cycleId, "READ");
  return resource;
}

export async function createTradingCycle(session: SessionPayload, input: CreateTradingCycleInput) {
  await requireBusinessAccess(input.businessId);

  const cycle = await prisma.tradingCycle.create({
    data: {
      businessId: input.businessId,
      cycleCode: input.cycleCode.trim(),
      startDate: new Date(input.startDate),
      status: input.status || TradingCycleStatus.DRAFT,
    },
    include: { business: { select: { id: true, name: true, code: true } } },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "TRADING_CYCLE_CREATED",
    entity: "TradingCycle",
    entityId: cycle.id,
    newValues: { cycleCode: cycle.cycleCode, businessId: input.businessId },
  });

  return cycle;
}

export async function updateTradingCycle(session: SessionPayload, cycleId: string, input: UpdateTradingCycleInput) {
  await requireResourceAccess("TradingCycle", cycleId, "WRITE");

  const updated = await prisma.tradingCycle.update({
    where: { id: cycleId },
    data: {
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      completionDate: input.completionDate !== undefined ? (input.completionDate ? new Date(input.completionDate) : null) : undefined,
      grossRealizationAed: input.grossRealizationAed !== undefined ? new Prisma.Decimal(input.grossRealizationAed) : undefined,
      purchaseLandedCostAed: input.purchaseLandedCostAed !== undefined ? new Prisma.Decimal(input.purchaseLandedCostAed) : undefined,
      directExpensesAed: input.directExpensesAed !== undefined ? new Prisma.Decimal(input.directExpensesAed) : undefined,
      grossArbitrageSpreadAed: input.grossArbitrageSpreadAed !== undefined ? new Prisma.Decimal(input.grossArbitrageSpreadAed) : undefined,
      netProfitAed: input.netProfitAed !== undefined ? new Prisma.Decimal(input.netProfitAed) : undefined,
      investorShareTotalAed: input.investorShareTotalAed !== undefined ? new Prisma.Decimal(input.investorShareTotalAed) : undefined,
      deskRetainedProfitAed: input.deskRetainedProfitAed !== undefined ? new Prisma.Decimal(input.deskRetainedProfitAed) : undefined,
      status: input.status,
    },
    include: { business: { select: { id: true, name: true, code: true } } },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "TRADING_CYCLE_UPDATED",
    entity: "TradingCycle",
    entityId: updated.id,
    newValues: { status: updated.status, netProfitAed: updated.netProfitAed },
  });

  return updated;
}

export async function completeTradingCycle(session: SessionPayload, cycleId: string) {
  await requireResourceAccess("TradingCycle", cycleId, "WRITE");

  const completed = await prisma.tradingCycle.update({
    where: { id: cycleId },
    data: {
      status: TradingCycleStatus.COMPLETED,
      completionDate: new Date(),
    },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "TRADING_CYCLE_COMPLETED_LOCKED",
    entity: "TradingCycle",
    entityId: completed.id,
  });

  return completed;
}

export async function deleteTradingCycle(session: SessionPayload, cycleId: string) {
  await requireResourceAccess("TradingCycle", cycleId, "DELETE");

  const deleted = await prisma.tradingCycle.delete({
    where: { id: cycleId },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "TRADING_CYCLE_DELETED",
    entity: "TradingCycle",
    entityId: deleted.id,
  });

  return { success: true };
}
