import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionPayload } from "./session";
import { requireAuth, AuthError } from "./guards";
import { logAuditEvent } from "@/lib/audit/audit.service";
import {
  UserRole,
  PurchaseStatus,
  SaleStatus,
  ExpensePaymentStatus,
  Prisma,
} from "@prisma/client";

export type DomainResourceType =
  | "Business"
  | "Investor"
  | "Investment"
  | "Purchase"
  | "Sale"
  | "Inventory"
  | "Expense"
  | "Transaction"
  | "AuditLog";

export function forbiddenErrorResponse(message = "You do not have permission to access this resource") {
  return NextResponse.json(
    {
      success: false,
      error: "FORBIDDEN",
      message,
    },
    { status: 403 }
  );
}

export function lockedResourceResponse(message = "This financial record is locked and cannot be modified or deleted.") {
  return NextResponse.json(
    {
      success: false,
      error: "LOCKED_RESOURCE",
      message,
    },
    { status: 403 }
  );
}

/**
 * Authoritative check to identify if a business is Partner-owned without Admin participation.
 * Rule:
 * 1. Must have an assigned Partner (partnerId is not null).
 * 2. Admin investment is 0 or less (no financial participation from Admin).
 * 3. The business was created by a Partner user (creation audit log has creator role PARTNER, or non-ADMIN).
 */
export async function isBusinessPartnerOwnedWithoutAdmin(
  businessOrId:
    | string
    | {
        id: string;
        partnerId: string | null;
        adminInvestmentAED: Prisma.Decimal | number | string;
      }
): Promise<boolean> {
  const b =
    typeof businessOrId === "string"
      ? await prisma.business.findUnique({
          where: { id: businessOrId },
          select: { id: true, partnerId: true, adminInvestmentAED: true },
        })
      : businessOrId;

  if (!b || !b.partnerId || Number(b.adminInvestmentAED) > 0) {
    return false;
  }

  const creationLog = await prisma.auditLog.findFirst({
    where: {
      entity: "Business",
      entityId: b.id,
      action: "BUSINESS_CREATED",
    },
    include: {
      user: { select: { role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (creationLog && creationLog.user) {
    return creationLog.user.role === UserRole.PARTNER;
  }

  // Fallback: if no creation log found, partnerId is set and admin investment is 0
  return true;
}

/**
 * Require a fully authenticated session where mustChangePassword has been completed.
 */
export async function requireActiveSession(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.mustChangePassword) {
    throw new AuthError("Password change required before accessing domain resources", 403);
  }
  return session;
}

/**
 * Retrieve the list of authorized Business IDs for the session.
 * ADMIN returns "ALL". PARTNER returns an array of assigned Business IDs.
 */
export async function getAuthorizedBusinessIds(session: SessionPayload): Promise<string[] | "ALL"> {
  if (session.role === UserRole.ADMIN) {
    return "ALL";
  }

  const assigned = await prisma.business.findMany({
    where: { partnerId: session.userId },
    select: { id: true },
  });

  return assigned.map((b: { id: string }) => b.id);
}

/**
 * Enforce that the authenticated user has access to a specific Business ID.
 * If operation is "WRITE" or "DELETE", verifies that Admins cannot mutate Partner-owned businesses without Admin participation.
 */
export async function requireBusinessAccess(
  businessId: string,
  currentSession?: SessionPayload,
  operation: "READ" | "WRITE" | "DELETE" = "READ"
): Promise<{
  session: SessionPayload;
  isGlobalAdmin: boolean;
}> {
  const session = currentSession || (await requireActiveSession());

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, partnerId: true, adminInvestmentAED: true },
  });

  if (!business) {
    throw new AuthError("Business not found", 404);
  }

  if (session.role === UserRole.ADMIN) {
    if (operation === "WRITE" || operation === "DELETE") {
      const isPartnerOwned = await isBusinessPartnerOwnedWithoutAdmin(business);
      if (isPartnerOwned) {
        await logAuditEvent({
          userId: session.userId,
          action: "UNAUTHORIZED_ACCESS_ATTEMPT",
          entity: "Business",
          entityId: businessId,
          oldValues: { attemptedOperation: operation, reason: "ADMIN_VIEW_ONLY_PARTNER_OWNED" },
        });
        throw new AuthError(
          "This partner-owned business operates without Admin participation and is view-only for administrators.",
          403
        );
      }
    }
    return { session, isGlobalAdmin: true };
  }

  if (business.partnerId !== session.userId) {
    await logAuditEvent({
      userId: session.userId,
      action: "UNAUTHORIZED_ACCESS_ATTEMPT",
      entity: "Business",
      entityId: businessId,
      oldValues: { attemptedRole: session.role },
    });
    throw new AuthError("You do not have permission to access this business", 403);
  }

  return { session, isGlobalAdmin: false };
}

/**
 * Assert that a financial record is currently mutable.
 * Throws AuthError(403) if the record is locked or immutable.
 */
export function assertResourceMutable(
  resourceType: DomainResourceType,
  record: Record<string, unknown>
): void {
  // 1. Transaction records are strictly append-only ledger entries
  if (resourceType === "Transaction") {
    throw new AuthError("Transaction records are immutable ledger entries and cannot be modified or deleted.", 403);
  }

  // 2. AuditLog is strictly append-only
  if (resourceType === "AuditLog") {
    throw new AuthError("AuditLog entries are immutable and cannot be modified or deleted.", 403);
  }

  // 3. Cleared Purchases are locked
  if (resourceType === "Purchase") {
    if (record.status === PurchaseStatus.CLEARED) {
      throw new AuthError("Cleared purchases are finalized and immutable. Modifications are prohibited.", 403);
    }
  }

  // 4. Cleared Sales are locked
  if (resourceType === "Sale") {
    if (record.status === SaleStatus.CLEARED) {
      throw new AuthError("Cleared sales are finalized and immutable. Modifications are prohibited.", 403);
    }
  }

  // 5. Cleared Expenses are locked
  if (resourceType === "Expense") {
    if (record.status === ExpensePaymentStatus.CLEARED) {
      throw new AuthError("Cleared expenses are finalized and immutable. Modifications are prohibited.", 403);
    }
  }
}

export interface ResourceResolution<T = Record<string, unknown>> {
  session: SessionPayload;
  resource: T;
  businessId: string;
}

/**
 * IDOR Protection: Load resource from database, resolve its owning businessId,
 * verify authenticated user's ownership scope, and check financial mutability on write/delete operations.
 */
export async function requireResourceAccess<T = Record<string, unknown>>(
  resourceType: DomainResourceType,
  resourceId: string,
  operation: "READ" | "WRITE" | "DELETE" = "READ",
  currentSession?: SessionPayload
): Promise<ResourceResolution<T>> {
  const session = currentSession || (await requireActiveSession());

  let resource: Record<string, unknown> | null = null;
  let businessId: string | null = null;

  switch (resourceType) {
    case "Business": {
      const b = await prisma.business.findUnique({ where: { id: resourceId } });
      if (b) {
        resource = b as unknown as Record<string, unknown>;
        businessId = b.id;
      }
      break;
    }
    case "Investor": {
      const inv = await prisma.investor.findUnique({
        where: { id: resourceId },
        include: { business: { select: { id: true, partnerId: true } } },
      });
      if (inv) {
        resource = inv as unknown as Record<string, unknown>;
        businessId = inv.businessId;
      }
      break;
    }
    case "Investment": {
      const item = await prisma.investment.findUnique({
        where: { id: resourceId },
        include: { business: { select: { id: true, partnerId: true } } },
      });
      if (item) {
        resource = item as unknown as Record<string, unknown>;
        businessId = item.businessId;
      }
      break;
    }
    case "Purchase": {
      const item = await prisma.purchase.findUnique({
        where: { id: resourceId },
        include: { business: { select: { id: true, partnerId: true } } },
      });
      if (item) {
        resource = item as unknown as Record<string, unknown>;
        businessId = item.businessId;
      }
      break;
    }
    case "Sale": {
      const item = await prisma.sale.findUnique({
        where: { id: resourceId },
        include: { business: { select: { id: true, partnerId: true } } },
      });
      if (item) {
        resource = item as unknown as Record<string, unknown>;
        businessId = item.businessId;
      }
      break;
    }
    case "Inventory": {
      const item = await prisma.inventory.findUnique({
        where: { id: resourceId },
        include: { business: { select: { id: true, partnerId: true } } },
      });
      if (item) {
        resource = item as unknown as Record<string, unknown>;
        businessId = item.businessId;
      }
      break;
    }
    case "Expense": {
      const item = await prisma.expense.findUnique({
        where: { id: resourceId },
        include: { business: { select: { id: true, partnerId: true } } },
      });
      if (item) {
        resource = item as unknown as Record<string, unknown>;
        businessId = item.businessId;
      }
      break;
    }
    case "Transaction": {
      const item = await prisma.transaction.findUnique({
        where: { id: resourceId },
        include: { business: { select: { id: true, partnerId: true } } },
      });
      if (item) {
        resource = item as unknown as Record<string, unknown>;
        businessId = item.businessId;
      }
      break;
    }
    case "AuditLog": {
      if (session.role !== UserRole.ADMIN) {
        throw new AuthError("Audit logs are accessible to system administrators only.", 403);
      }
      const item = await prisma.auditLog.findUnique({ where: { id: resourceId } });
      if (item) {
        resource = item as unknown as Record<string, unknown>;
      }
      break;
    }
  }

  if (!resource) {
    throw new AuthError(`${resourceType} not found`, 404);
  }

  // If the resource belongs to a Business, enforce Partner scope
  if (businessId && session.role === UserRole.PARTNER) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { partnerId: true },
    });

    if (!business || business.partnerId !== session.userId) {
      await logAuditEvent({
        userId: session.userId,
        action: "UNAUTHORIZED_ACCESS_ATTEMPT",
        entity: resourceType,
        entityId: resourceId,
        oldValues: { targetBusinessId: businessId },
      });
      throw new AuthError("You do not have permission to access this resource", 403);
    }
  }

  // If the resource belongs to a Business and operation is WRITE or DELETE, enforce Admin View-Only on partner-owned businesses without Admin
  if (businessId && (operation === "WRITE" || operation === "DELETE")) {
    if (session.role === UserRole.ADMIN) {
      const isPartnerOwned = await isBusinessPartnerOwnedWithoutAdmin(businessId);
      if (isPartnerOwned) {
        await logAuditEvent({
          userId: session.userId,
          action: "UNAUTHORIZED_ACCESS_ATTEMPT",
          entity: resourceType,
          entityId: resourceId,
          oldValues: { operation, reason: "ADMIN_VIEW_ONLY_PARTNER_OWNED" },
        });
        throw new AuthError(
          "This partner-owned business operates without Admin participation and is view-only for administrators.",
          403
        );
      }
    }
  }

  // Enforce financial immutability for mutation/deletion operations
  if (operation === "WRITE" || operation === "DELETE") {
    try {
      assertResourceMutable(resourceType, resource);
    } catch (err) {
      if (err instanceof AuthError) {
        await logAuditEvent({
          userId: session.userId,
          action: "FINANCIAL_MUTATION_BLOCKED",
          entity: resourceType,
          entityId: resourceId,
          oldValues: {
            status: String((resource as Record<string, unknown>).status || "UNKNOWN"),
            operation,
          },
        });
      }
      throw err;
    }
  }

  return {
    session,
    resource: resource as T,
    businessId: businessId || "",
  };
}
