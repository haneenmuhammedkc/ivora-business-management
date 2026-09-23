import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, UserRole } from "@prisma/client";

export interface CreateInvestorInput {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  defaultSharePct?: number;
  businessId?: string;
  status?: string;
}

export interface UpdateInvestorInput {
  name?: string;
  email?: string;
  phone?: string;
  defaultSharePct?: number;
  status?: string;
}

export async function listInvestors(session: SessionPayload, businessId?: string) {
  if (businessId) {
    await requireBusinessAccess(businessId);
    return prisma.investor.findMany({
      where: { businessId },
      include: {
        business: { select: { id: true, name: true, code: true } },
        investments: { select: { id: true, committedAmount: true, profitSharePct: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  const where: Prisma.InvestorWhereInput =
    session.role === UserRole.ADMIN
      ? {}
      : {
          OR: [
            { business: { partnerId: session.userId } },
            { businessId: null }, // unassigned pool
          ],
        };

  return prisma.investor.findMany({
    where,
    include: {
      business: { select: { id: true, name: true, code: true } },
      investments: { select: { id: true, committedAmount: true, profitSharePct: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvestorById(session: SessionPayload, investorId: string) {
  const { resource } = await requireResourceAccess("Investor", investorId, "READ");
  return resource;
}

export async function createInvestor(session: SessionPayload, input: CreateInvestorInput) {
  if (input.businessId) {
    await requireBusinessAccess(input.businessId);
  }

  const investor = await prisma.investor.create({
    data: {
      name: input.name.trim(),
      code: input.code.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      defaultSharePct: input.defaultSharePct !== undefined ? new Prisma.Decimal(input.defaultSharePct) : null,
      businessId: input.businessId || null,
      status: input.status || "ACTIVE",
    },
    include: { business: { select: { id: true, name: true, code: true } } },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "INVESTOR_CREATED",
    entity: "Investor",
    entityId: investor.id,
    newValues: { code: investor.code, name: investor.name, businessId: input.businessId },
  });

  return investor;
}

export async function updateInvestor(session: SessionPayload, investorId: string, input: UpdateInvestorInput) {
  await requireResourceAccess("Investor", investorId, "WRITE");

  const updated = await prisma.investor.update({
    where: { id: investorId },
    data: {
      name: input.name?.trim(),
      email: input.email !== undefined ? input.email?.trim() || null : undefined,
      phone: input.phone !== undefined ? input.phone?.trim() || null : undefined,
      defaultSharePct: input.defaultSharePct !== undefined ? new Prisma.Decimal(input.defaultSharePct) : undefined,
      status: input.status,
    },
    include: { business: { select: { id: true, name: true, code: true } } },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "INVESTOR_UPDATED",
    entity: "Investor",
    entityId: updated.id,
    newValues: input as Record<string, unknown>,
  });

  return updated;
}
