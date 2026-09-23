import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { AuthError } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, UserRole, BusinessStatus } from "@prisma/client";

export interface CreateBusinessInput {
  name: string;
  code: string;
  description?: string;
  partnerId: string;
  partnerEquityPct: number;
}

export interface UpdateBusinessInput {
  name?: string;
  description?: string;
  status?: BusinessStatus;
  partnerId?: string;
  partnerEquityPct?: number;
}

/**
 * List Businesses within the caller's authorization scope.
 * ADMIN: all businesses. PARTNER: only businesses assigned to caller.
 */
export async function listBusinesses(session: SessionPayload) {
  const where: Prisma.BusinessWhereInput =
    session.role === UserRole.ADMIN
      ? {}
      : { partnerId: session.userId };

  return prisma.business.findMany({
    where,
    include: {
      partner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch a single Business by ID with ownership scope enforcement.
 */
export async function getBusinessById(session: SessionPayload, businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      partner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      investors: { select: { id: true, name: true, code: true } },
      tradingCycles: { select: { id: true, cycleCode: true, status: true } },
    },
  });

  if (!business) {
    throw new AuthError("Business not found", 404);
  }

  if (session.role === UserRole.PARTNER && business.partnerId !== session.userId) {
    await logAuditEvent({
      userId: session.userId,
      action: "UNAUTHORIZED_ACCESS_ATTEMPT",
      entity: "Business",
      entityId: businessId,
    });
    throw new AuthError("You do not have permission to access this business", 403);
  }

  return business;
}

/**
 * Create a new Business (ADMIN ONLY).
 */
export async function createBusiness(session: SessionPayload, input: CreateBusinessInput) {
  if (session.role !== UserRole.ADMIN) {
    throw new AuthError("Only system administrators can create business entities.", 403);
  }

  const { name, code, description, partnerId, partnerEquityPct } = input;

  if (!name || !code || !partnerId || partnerEquityPct === undefined) {
    throw new AuthError("Business name, code, partner assignment, and equity percentage are required.", 400);
  }

  // Verify that partnerId belongs to a valid User with role PARTNER
  const partnerUser = await prisma.user.findUnique({
    where: { id: partnerId },
  });

  if (!partnerUser || partnerUser.role !== UserRole.PARTNER) {
    throw new AuthError("A business can only be assigned to a valid Partner user account.", 400);
  }

  const existingCode = await prisma.business.findUnique({
    where: { code: code.trim() },
  });

  if (existingCode) {
    throw new AuthError(`Business code ${code} is already in use.`, 400);
  }

  const business = await prisma.business.create({
    data: {
      name: name.trim(),
      code: code.trim(),
      description: description?.trim() || null,
      partnerId,
      partnerEquityPct: new Prisma.Decimal(partnerEquityPct),
      status: BusinessStatus.ACTIVE,
    },
    include: {
      partner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "BUSINESS_CREATED",
    entity: "Business",
    entityId: business.id,
    newValues: { name: business.name, code: business.code, partnerId },
  });

  return business;
}

/**
 * Update Business configuration / Partner assignment (ADMIN ONLY).
 */
export async function updateBusiness(session: SessionPayload, businessId: string, input: UpdateBusinessInput) {
  if (session.role !== UserRole.ADMIN) {
    throw new AuthError("Only system administrators can configure business assignments.", 403);
  }

  const existing = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!existing) {
    throw new AuthError("Business not found", 404);
  }

  if (input.partnerId) {
    const partnerUser = await prisma.user.findUnique({
      where: { id: input.partnerId },
    });
    if (!partnerUser || partnerUser.role !== UserRole.PARTNER) {
      throw new AuthError("The assigned user must be a valid Partner.", 400);
    }
  }

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      name: input.name?.trim(),
      description: input.description !== undefined ? input.description?.trim() || null : undefined,
      status: input.status,
      partnerId: input.partnerId,
      partnerEquityPct: input.partnerEquityPct !== undefined ? new Prisma.Decimal(input.partnerEquityPct) : undefined,
    },
    include: {
      partner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "BUSINESS_UPDATED",
    entity: "Business",
    entityId: updated.id,
    newValues: {
      name: updated.name,
      status: updated.status,
      partnerId: updated.partnerId,
    },
  });

  return updated;
}
