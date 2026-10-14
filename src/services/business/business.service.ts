import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { AuthError } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { ensureBusinessParticipants } from "@/services/investor/investor.service";
import { Prisma, UserRole, BusinessStatus, PurchaseStatus, TransactionType } from "@prisma/client";
import { getOrSetCache } from "@/lib/redis/cache";
import { CacheKeys, CacheTTL } from "@/lib/redis/keys";
import { invalidateBusinessFinancials } from "@/lib/redis/invalidation";

export interface CreateBusinessInput {
  name: string;
  code?: string;
  businessType: string;
  description?: string | null;
  partnerId?: string | null;
  partnerEquityPct?: number | string;
  totalInvestment: number | string;
  adminInvestment?: number | string;
  partnerInvestment?: number | string;
}

export interface UpdateBusinessInput {
  name?: string;
  businessType?: string;
  description?: string;
  totalInvestmentAED?: number | string;
  adminInvestmentAED?: number | string;
  partnerInvestmentAED?: number | string;
  status?: BusinessStatus;
  partnerId?: string;
  partnerEquityPct?: number | string;
}

/**
 * Generate a unique business code if none is provided.
 */
async function generateUniqueBusinessCode(name: string): Promise<string> {
  const match = name.match(/\b(?:Business|Entity|B)?\s*(\d+)\b/i);
  let baseCode = "";
  if (match && match[1]) {
    const num = match[1].padStart(2, "0");
    baseCode = `B${num}-DXB-BOM`;
  } else {
    const count = await prisma.business.count();
    const num = String(count + 1).padStart(2, "0");
    baseCode = `B${num}-DXB-BOM`;
  }

  // Verify uniqueness or append index
  let finalCode = baseCode;
  let counter = 1;
  while (await prisma.business.findUnique({ where: { code: finalCode } })) {
    counter++;
    finalCode = `${baseCode}-${counter}`;
  }

  return finalCode;
}

import { isBusinessPartnerOwnedWithoutAdmin } from "@/lib/auth/authorization";
export { isBusinessPartnerOwnedWithoutAdmin };

/**
 * List Businesses within the caller's authorization scope.
 * ADMIN: all businesses. PARTNER: only businesses assigned to caller.
 */
export async function listBusinesses(session: SessionPayload) {
  const cacheKey = CacheKeys.businesses.list(session.role, session.userId);

  return getOrSetCache(cacheKey, CacheTTL.LONG, async () => {
    const where: Prisma.BusinessWhereInput =
      session.role === UserRole.ADMIN
        ? {}
        : { partnerId: session.userId };

    const rawBusinesses = await prisma.business.findMany({
      where,
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
        investments: {
          select: { committedAmount: true },
        },
        purchases: {
          where: { status: { in: [PurchaseStatus.CLEARED, PurchaseStatus.IN_PROGRESS] } },
          select: { totalLandedCost: true, baseAcquisitionValue: true },
        },
        sales: {
          select: { aedEquivalent: true },
        },
        expenses: {
          select: { amount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const businessIds = rawBusinesses.map((b) => b.id);
    const creationLogs = await prisma.auditLog.findMany({
      where: {
        entity: "Business",
        entityId: { in: businessIds },
        action: "BUSINESS_CREATED",
      },
      select: {
        entityId: true,
        user: { select: { role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const creationRoleMap = new Map<string, UserRole>();
    for (const log of creationLogs) {
      if (log.entityId && !creationRoleMap.has(log.entityId) && log.user?.role) {
        creationRoleMap.set(log.entityId, log.user.role);
      }
    }

    return rawBusinesses.map((b) => {
      const totalExternalInvestments = b.investments.reduce(
        (acc, inv) => acc + Number(inv.committedAmount),
        0
      );
      const purchaseCost = b.purchases.reduce(
        (acc, p) => acc + Number(p.totalLandedCost ?? p.baseAcquisitionValue ?? 0),
        0
      );
      const sales = b.sales.reduce(
        (acc, s) => acc + Number(s.aedEquivalent),
        0
      );
      const expenses = b.expenses.reduce(
        (acc, e) => acc + Number(e.amount),
        0
      );
      const netProfit = sales - purchaseCost - expenses;
      const margin = sales > 0 ? (netProfit / sales) * 100 : 0;

      const partnerEquity = Number(b.partnerEquityPct) || 0;
      const adminEquity = Math.max(0, 100 - partnerEquity);
      const nonAdminPartnerName = b.partner?.name?.trim() || "";
      const displayPartnerName = nonAdminPartnerName || "No partner";

      const totalInvestmentAED = Number(b.totalInvestmentAED) || 0;
      const effectiveInvestmentAED =
        totalInvestmentAED > 0 ? totalInvestmentAED : totalExternalInvestments;

      const adminInvestmentAED = Number(b.adminInvestmentAED) || 0;
      const partnerInvestmentAED = Number(b.partnerInvestmentAED) || 0;

      const creatorRole = creationRoleMap.get(b.id);
      const isPartnerOwnedWithoutAdmin =
        Boolean(b.partnerId) &&
        adminInvestmentAED <= 0 &&
        (creatorRole ? creatorRole === UserRole.PARTNER : true);

      const isViewOnlyForAdmin =
        session.role === UserRole.ADMIN && isPartnerOwnedWithoutAdmin;

      const formattedDate = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(b.createdAt));

      return {
        id: b.id,
        name: b.name,
        code: b.code,
        businessType: b.businessType,
        description: b.description,
        subtitle: b.description || `${b.name} • ${b.code}`,
        totalInvestmentAED: effectiveInvestmentAED,
        adminInvestmentAED,
        partnerInvestmentAED,
        partnerId: b.partnerId,
        partner: b.partner,
        partnerEquityPct: partnerEquity,
        adminEquityPct: adminEquity,
        partners: [
          { name: "Admin", sharePercentage: adminEquity },
          { name: nonAdminPartnerName || "Partner", sharePercentage: partnerEquity },
        ],
        partnersSummary: displayPartnerName,
        partnerName: displayPartnerName,
        investmentAED: effectiveInvestmentAED,
        purchaseCostAED: purchaseCost,
        totalPurchases: purchaseCost,
        remainingPurchaseCapacity: Math.max(0, effectiveInvestmentAED - purchaseCost),
        salesIndiaAED: sales,
        expensesAED: expenses,
        netProfitAED: netProfit,
        marginPercentage: Number(margin.toFixed(2)),
        status: b.status,
        createdAt: formattedDate,
        productType: b.businessType || "Gold Bullion",
        locationRoute: "Dubai (DXB) → Mumbai (BOM)",
        isPartnerOwnedWithoutAdmin,
        isViewOnlyForAdmin,
      };
    });
  });
}

/**
 * Fetch a single Business by ID with ownership scope enforcement.
 */
export async function getBusinessById(session: SessionPayload, businessId: string) {
  const cacheKey = CacheKeys.businesses.detail(businessId);

  const business = await getOrSetCache(cacheKey, CacheTTL.LONG, async () => {
    const raw = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
        investors: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
            type: true,
            defaultSharePct: true,
            status: true,
          },
        },
        investments: {
          select: {
            id: true,
            investorId: true,
            committedAmount: true,
            profitSharePct: true,
            allocatedGrams: true,
            depositDate: true,
            status: true,
            investor: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
              },
            },
          },
          orderBy: { depositDate: "desc" },
        },
        purchases: {
          select: {
            id: true,
            purchaseCode: true,
            purchaseDate: true,
            sourcingVault: true,
            productType: true,
            quantityGms: true,
            basePricePerGm: true,
            baseAcquisitionValue: true,
            transitInsuranceFreight: true,
            vaultHandlingLabour: true,
            customsSecurity: true,
            totalLandedCost: true,
            status: true,
          },
          orderBy: { purchaseDate: "desc" },
        },
        sales: {
          select: {
            id: true,
            saleCode: true,
            saleDate: true,
            liquidationDesk: true,
            buyerFirm: true,
            productType: true,
            quantityGms: true,
            sellingPricePerGm: true,
            inrRealizationValue: true,
            realizedFxRate: true,
            aedEquivalent: true,
            status: true,
          },
          orderBy: { saleDate: "desc" },
        },
        expenses: {
          select: {
            id: true,
            expenseCode: true,
            category: true,
            description: true,
            paymentMethod: true,
            amount: true,
            expenseDate: true,
            status: true,
            isPurchaseLandedCost: true,
          },
          orderBy: { expenseDate: "desc" },
        },
        transactions: {
          select: {
            id: true,
            transactionCode: true,
            amount: true,
            type: true,
            paymentMethod: true,
            bankReference: true,
            escrowAccount: true,
            transactionDate: true,
          },
          orderBy: { transactionDate: "desc" },
        },
      },
    });

    if (!raw) {
      return null;
    }

    const totalExternalInvestments = raw.investments.reduce(
      (acc, inv) => acc + Number(inv.committedAmount),
      0
    );
    const purchaseCost = raw.purchases
      .filter((p) => p.status !== PurchaseStatus.DRAFT)
      .reduce((acc, p) => acc + Number(p.totalLandedCost ?? p.baseAcquisitionValue ?? 0), 0);
    const sales = raw.sales.reduce(
      (acc, s) => acc + Number(s.aedEquivalent),
      0
    );
    const expenses = raw.expenses.reduce(
      (acc, e) => acc + Number(e.amount),
      0
    );
    const netProfit = sales - purchaseCost - expenses;
    const margin = sales > 0 ? (netProfit / sales) * 100 : 0;

    const partnerEquity = Number(raw.partnerEquityPct) || 0;
    const adminEquity = Math.max(0, 100 - partnerEquity);
    const totalInvestmentAED = Number(raw.totalInvestmentAED) || 0;
    const effectiveInvestmentAED =
      totalInvestmentAED > 0 ? totalInvestmentAED : totalExternalInvestments;
    const adminInvestmentAED = Number(raw.adminInvestmentAED) || 0;
    const partnerInvestmentAED = Number(raw.partnerInvestmentAED) || 0;

    const nonAdminPartnerName = raw.partner?.name?.trim() || "";
    const displayPartnerName = nonAdminPartnerName || "No partner";

    const formattedDate = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(raw.createdAt));

    const creationLog = await prisma.auditLog.findFirst({
      where: {
        entity: "Business",
        entityId: raw.id,
        action: "BUSINESS_CREATED",
      },
      select: {
        user: { select: { role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const isPartnerOwnedWithoutAdmin =
      Boolean(raw.partnerId) &&
      adminInvestmentAED <= 0 &&
      (creationLog && creationLog.user ? creationLog.user.role === UserRole.PARTNER : true);

    return {
      ...raw,
      totalInvestmentAED: effectiveInvestmentAED,
      adminInvestmentAED,
      partnerInvestmentAED,
      partnerEquityPct: partnerEquity,
      adminEquityPct: adminEquity,
      partnerName: displayPartnerName,
      partnersSummary: displayPartnerName,
      investmentAED: effectiveInvestmentAED,
      purchaseCostAED: purchaseCost,
      totalPurchases: purchaseCost,
      remainingPurchaseCapacity: Math.max(0, effectiveInvestmentAED - purchaseCost),
      salesIndiaAED: sales,
      expensesAED: expenses,
      netProfitAED: netProfit,
      marginPercentage: Number(margin.toFixed(2)),
      createdAtFormatted: formattedDate,
      subtitle: raw.description || `${raw.name} • ${raw.code}`,
      isPartnerOwnedWithoutAdmin,
    };
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

  const isViewOnlyForAdmin =
    session.role === UserRole.ADMIN && Boolean(business.isPartnerOwnedWithoutAdmin);

  return {
    ...business,
    isPartnerOwnedWithoutAdmin: Boolean(business.isPartnerOwnedWithoutAdmin),
    isViewOnlyForAdmin,
  };
}

/**
 * Create a new Business (ADMIN or PARTNER).
 */
export async function createBusiness(session: SessionPayload, input: CreateBusinessInput) {
  if (session.role !== UserRole.ADMIN && session.role !== UserRole.PARTNER) {
    throw new AuthError("You do not have permission to create business entities.", 403);
  }

  const {
    name,
    code,
    businessType,
    description,
    partnerId,
    partnerEquityPct,
    totalInvestment,
    adminInvestment,
    partnerInvestment,
  } = input;

  // Basic fallback defense-in-depth validation
  if (!name || !name.trim()) {
    throw new AuthError("Business name is required.", 400);
  }
  if (!businessType || !businessType.trim()) {
    throw new AuthError("Business type is required.", 400);
  }

  const totalInvNum = Number(totalInvestment);
  if (isNaN(totalInvNum) || totalInvNum <= 0) {
    throw new AuthError("Please provide a valid total investment amount greater than 0.", 400);
  }

  // Determine effective partnerId based on caller role
  let effectivePartnerId: string | undefined = undefined;
  if (session.role === UserRole.PARTNER) {
    // Strictly enforce partner's own ID regardless of input to prevent IDOR
    effectivePartnerId = session.userId;
  } else if (session.role === UserRole.ADMIN) {
    if (partnerId && partnerId.trim()) {
      const partnerUser = await prisma.user.findUnique({
        where: { id: partnerId.trim() },
      });
      if (!partnerUser || partnerUser.role !== UserRole.PARTNER) {
        throw new AuthError("A business can only be assigned to a valid Partner user account.", 400);
      }
      effectivePartnerId = partnerUser.id;
    } else {
      effectivePartnerId = undefined;
    }
  }

  const adminInvNum =
    adminInvestment !== undefined &&
    adminInvestment !== null &&
    adminInvestment !== ""
      ? Number(adminInvestment)
      : 0;

  let partnerInvNum =
    partnerInvestment !== undefined &&
    partnerInvestment !== null &&
    partnerInvestment !== ""
      ? Number(partnerInvestment)
      : 0;

  if (isNaN(adminInvNum) || adminInvNum < 0) {
    throw new AuthError("Admin investment amount cannot be negative.", 400);
  }
  if (isNaN(partnerInvNum) || partnerInvNum < 0) {
    throw new AuthError("Partner investment amount cannot be negative.", 400);
  }

  // If no partner is assigned, partner investment must be 0
  if (!effectivePartnerId) {
    if (partnerInvNum > 0) {
      throw new AuthError("Partner investment must be 0 when no partner is assigned.", 400);
    }
    partnerInvNum = 0;
  }

  if (partnerInvNum > totalInvNum) {
    throw new AuthError("Partner investment cannot exceed total investment.", 400);
  }
  if (adminInvNum > totalInvNum) {
    throw new AuthError("Admin investment cannot exceed total investment.", 400);
  }
  if (adminInvNum + partnerInvNum > totalInvNum) {
    throw new AuthError("Sum of admin and partner investments cannot exceed total investment.", 400);
  }

  // Calculate Partner Equity % safely
  let calculatedEquity = 0.0;
  if (effectivePartnerId) {
    if (partnerInvNum > 0 && totalInvNum > 0) {
      calculatedEquity = Number(((partnerInvNum / totalInvNum) * 100).toFixed(2));
    } else if (
      partnerEquityPct !== undefined &&
      partnerEquityPct !== null &&
      partnerEquityPct !== ""
    ) {
      const pct = Number(partnerEquityPct);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        throw new AuthError("Partner equity percentage must be between 0% and 100%.", 400);
      }
      calculatedEquity = Number(pct.toFixed(2));
    } else {
      calculatedEquity = 0.0;
    }
  }

  // Code determination & uniqueness check
  let finalCode = code?.trim().toUpperCase();
  if (!finalCode) {
    finalCode = await generateUniqueBusinessCode(name.trim());
  } else {
    const existingCode = await prisma.business.findUnique({
      where: { code: finalCode },
    });
    if (existingCode) {
      throw new AuthError(`Business code ${finalCode} is already in use.`, 409);
    }
  }

  // Build description
  let finalDescription = description?.trim() || null;
  if (!finalDescription && businessType?.trim()) {
    finalDescription = `${businessType.trim()} Trading & Liquidation • ${finalCode}`;
  }

  const business = await prisma.business.create({
    data: {
      name: name.trim(),
      code: finalCode,
      businessType: businessType.trim(),
      description: finalDescription,
      totalInvestmentAED: new Prisma.Decimal(totalInvNum),
      adminInvestmentAED: new Prisma.Decimal(adminInvNum),
      partnerInvestmentAED: new Prisma.Decimal(partnerInvNum),
      partnerId: effectivePartnerId ?? undefined,
      partnerEquityPct: new Prisma.Decimal(calculatedEquity),
      status: BusinessStatus.ACTIVE,
    },
    include: {
      partner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Synchronize Admin and Partner participant records on write
  await ensureBusinessParticipants(business.id);

  // Invalidate cache
  await invalidateBusinessFinancials(business.id, business.partnerId);

  await logAuditEvent({
    userId: session.userId,
    action: "BUSINESS_CREATED",
    entity: "Business",
    entityId: business.id,
    newValues: {
      name: business.name,
      code: business.code,
      businessType: business.businessType,
      totalInvestmentAED: Number(business.totalInvestmentAED),
      adminInvestmentAED: Number(business.adminInvestmentAED),
      partnerInvestmentAED: Number(business.partnerInvestmentAED),
      partnerId: business.partnerId,
      partnerEquityPct: Number(business.partnerEquityPct),
      status: business.status,
    },
  });

  return business;
}

/**
 * Update Business configuration / Partner assignment.
 * ADMIN has full permissions on Admin-created businesses, but is VIEW-ONLY (403 Forbidden)
 * on Partner-owned businesses created without Admin participation.
 * PARTNER retains existing management permissions for their own businesses.
 */
export async function updateBusiness(
  session: SessionPayload,
  businessId: string,
  input: UpdateBusinessInput
) {
  const existing = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!existing) {
    throw new AuthError("Business not found", 404);
  }

  // View-Only check for Admin on Partner-owned businesses without Admin participation
  if (session.role === UserRole.ADMIN) {
    const isPartnerOwned = await isBusinessPartnerOwnedWithoutAdmin(existing);
    if (isPartnerOwned) {
      await logAuditEvent({
        userId: session.userId,
        action: "UNAUTHORIZED_ACCESS_ATTEMPT",
        entity: "Business",
        entityId: businessId,
        oldValues: {
          reason: "ADMIN_VIEW_ONLY_PARTNER_OWNED",
          attemptedUpdate: input,
        },
      });
      throw new AuthError(
        "This partner-owned business operates without Admin participation and is view-only for administrators.",
        403
      );
    }
  } else if (session.role === UserRole.PARTNER) {
    if (existing.partnerId !== session.userId) {
      throw new AuthError("You do not have permission to modify this business.", 403);
    }
    // Prevent partner from changing partnerId assignment to someone else
    if (input.partnerId && input.partnerId !== session.userId) {
      throw new AuthError("Partners cannot reassign business ownership.", 403);
    }
  } else {
    throw new AuthError("Only system administrators and owning partners can configure business entities.", 403);
  }

  let partnerChanged = false;
  let statusChanged = false;

  if (input.partnerId && input.partnerId !== existing.partnerId) {
    const partnerUser = await prisma.user.findUnique({
      where: { id: input.partnerId },
    });
    if (!partnerUser || partnerUser.role !== UserRole.PARTNER) {
      throw new AuthError("The assigned user must be a valid Partner.", 400);
    }
    partnerChanged = true;
  }

  if (input.status && input.status !== existing.status) {
    if (!Object.values(BusinessStatus).includes(input.status)) {
      throw new AuthError("Invalid business status value.", 400);
    }
    statusChanged = true;
  }

  if (input.partnerEquityPct !== undefined) {
    const pct = Number(input.partnerEquityPct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      throw new AuthError("Partner equity percentage must be between 0% and 100%.", 400);
    }
  }

  if (input.totalInvestmentAED !== undefined) {
    const inv = Number(input.totalInvestmentAED);
    if (isNaN(inv) || inv < 0) {
      throw new AuthError("Total investment must be a non-negative number.", 400);
    }
  }

  if (input.adminInvestmentAED !== undefined) {
    const adminInv = Number(input.adminInvestmentAED);
    if (isNaN(adminInv) || adminInv < 0) {
      throw new AuthError("Admin investment must be a non-negative number.", 400);
    }
  }

  if (input.partnerInvestmentAED !== undefined) {
    const partnerInv = Number(input.partnerInvestmentAED);
    if (isNaN(partnerInv) || partnerInv < 0) {
      throw new AuthError("Partner investment must be a non-negative number.", 400);
    }
  }

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      name: input.name?.trim(),
      businessType: input.businessType?.trim(),
      description:
        input.description !== undefined ? input.description?.trim() || null : undefined,
      totalInvestmentAED:
        input.totalInvestmentAED !== undefined
          ? new Prisma.Decimal(input.totalInvestmentAED)
          : undefined,
      adminInvestmentAED:
        input.adminInvestmentAED !== undefined
          ? new Prisma.Decimal(input.adminInvestmentAED)
          : undefined,
      partnerInvestmentAED:
        input.partnerInvestmentAED !== undefined
          ? new Prisma.Decimal(input.partnerInvestmentAED)
          : undefined,
      status: input.status,
      partnerId: input.partnerId,
      partnerEquityPct:
        input.partnerEquityPct !== undefined
          ? new Prisma.Decimal(input.partnerEquityPct)
          : undefined,
    },
    include: {
      partner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Log general update
  await logAuditEvent({
    userId: session.userId,
    action: "BUSINESS_UPDATED",
    entity: "Business",
    entityId: updated.id,
    newValues: {
      name: updated.name,
      businessType: updated.businessType,
      totalInvestmentAED: Number(updated.totalInvestmentAED),
      adminInvestmentAED: Number(updated.adminInvestmentAED),
      partnerInvestmentAED: Number(updated.partnerInvestmentAED),
      status: updated.status,
      partnerId: updated.partnerId,
      partnerEquityPct: Number(updated.partnerEquityPct),
    },
  });

  // Log status change if applicable
  if (statusChanged) {
    await logAuditEvent({
      userId: session.userId,
      action: "BUSINESS_STATUS_CHANGED",
      entity: "Business",
      entityId: updated.id,
      oldValues: { status: existing.status },
      newValues: { status: updated.status },
    });
  }

  // Log partner change if applicable
  if (partnerChanged) {
    await logAuditEvent({
      userId: session.userId,
      action: "BUSINESS_PARTNER_CHANGED",
      entity: "Business",
      entityId: updated.id,
      oldValues: { partnerId: existing.partnerId },
      newValues: { partnerId: updated.partnerId },
    });
  }

  // Synchronize Admin and Partner participant records on write
  await ensureBusinessParticipants(updated.id);

  // Invalidate Redis caches for active and prior partners
  await invalidateBusinessFinancials(updated.id, updated.partnerId);
  if (existing.partnerId && existing.partnerId !== updated.partnerId) {
    await invalidateBusinessFinancials(updated.id, existing.partnerId);
  }

  return updated;
}

export interface InventoryCheckResult {
  productType: string;
  quantityUnit: string;
  remainingQuantity: number;
  carryingValueAED: number;
}

export interface ParticipantSettlementPreview {
  investorId: string;
  investorName: string;
  investorCode: string;
  type: string;
  committedCapitalAED: number;
  contractualSharePct: number;
  allocatedProfitAED: number;
  capitalPaidAED: number;
  profitPaidAED: number;
  outstandingCapitalAED: number;
  outstandingProfitAED: number;
  totalSettlementDueAED: number;
  destination: "INVESTOR_PERSONAL_WALLET" | "DIRECT_BANK_DISBURSAL";
}

export interface BusinessClosureEligibility {
  isEligible: boolean;
  businessId: string;
  businessName: string;
  businessCode: string;
  status: BusinessStatus;
  unsoldInventory: InventoryCheckResult[];
  totalUnsoldQuantity: number;
  totalCarryingValueAED: number;
  unfinalizedSales: Array<{ id: string; saleCode: string; status: string; aedEquivalent: number }>;
  pendingExpenses: Array<{ id: string; expenseCode: string; status: string; amount: number }>;
  financialSummary: {
    totalRevenueAED: number;
    totalPurchasesAED: number;
    totalExpensesAED: number;
    netProfitAED: number;
  };
  settlementPreviews: ParticipantSettlementPreview[];
  totalSettlementDueAED: number;
  reasons: string[];
}

export interface BusinessInventoryLiquidationStatus {
  isLiquidated: boolean;
  unsoldInventory: InventoryCheckResult[];
  totalUnsoldQuantity: number;
  totalCarryingValueAED: number;
}

/**
 * Low-level, read-only stock liquidation reconciliation for a business.
 * Acyclic Layer 0 function with zero dependencies on settlement or closure services.
 */
export async function getBusinessInventoryLiquidationStatus(
  businessId: string
): Promise<BusinessInventoryLiquidationStatus> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      inventory: true,
      purchases: {
        where: { status: { in: ["CLEARED", "IN_PROGRESS"] } },
        select: { productType: true, quantityUnit: true, quantity: true },
      },
      sales: {
        select: { productType: true, quantityUnit: true, quantity: true },
      },
    },
  });

  if (!business) {
    return {
      isLiquidated: false,
      unsoldInventory: [],
      totalUnsoldQuantity: 0,
      totalCarryingValueAED: 0,
    };
  }

  const productKeys = new Set<string>();
  for (const p of business.purchases) {
    productKeys.add(`${p.productType}:::${p.quantityUnit}`);
  }
  for (const s of business.sales) {
    productKeys.add(`${s.productType}:::${s.quantityUnit}`);
  }

  const unsoldInventory: InventoryCheckResult[] = [];
  let totalUnsoldQuantity = 0;
  let totalCarryingValueAED = 0;

  for (const key of Array.from(productKeys)) {
    const [pType, qUnit] = key.split(":::");
    const purchased = business.purchases
      .filter((p) => p.productType === pType && p.quantityUnit === qUnit)
      .reduce((acc, p) => acc + Number(p.quantity), 0);
    const sold = business.sales
      .filter((s) => s.productType === pType && s.quantityUnit === qUnit)
      .reduce((acc, s) => acc + Number(s.quantity), 0);

    const remaining = Math.max(0, Math.round((purchased - sold) * 1000) / 1000);

    if (remaining > 0.0001) {
      const invRecord = business.inventory.find(
        (i) => i.productType === pType && i.quantityUnit === qUnit
      );
      const carryingVal = invRecord ? Number(invRecord.carryingValueAED) : 0;
      unsoldInventory.push({
        productType: pType,
        quantityUnit: qUnit,
        remainingQuantity: remaining,
        carryingValueAED: carryingVal,
      });
      totalUnsoldQuantity += remaining;
      totalCarryingValueAED += carryingVal;
    }
  }

  return {
    isLiquidated: unsoldInventory.length === 0,
    unsoldInventory,
    totalUnsoldQuantity,
    totalCarryingValueAED,
  };
}

/**
 * Checks whether a business is strictly eligible for closure.
 * Closure Conditions:
 * 1. Business exists and is not already SETTLED.
 * 2. All purchases have matching sales and remaining inventory quantity is <= 0 for every product.
 * 3. All sales are finalized / reconciled (none in draft/cancelled states).
 * 4. All operating expenses are accounted for.
 */
export async function getBusinessClosureEligibility(
  session: SessionPayload,
  businessId: string
): Promise<BusinessClosureEligibility> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      inventory: true,
      purchases: {
        where: { status: { in: ["CLEARED", "IN_PROGRESS"] } },
        select: { productType: true, quantityUnit: true, quantity: true, totalLandedCost: true },
      },
      sales: {
        select: { id: true, saleCode: true, status: true, productType: true, quantityUnit: true, quantity: true, aedEquivalent: true },
      },
      expenses: {
        select: { id: true, expenseCode: true, status: true, amount: true, isPurchaseLandedCost: true },
      },
      investments: {
        include: { investor: true },
      },
    },
  });

  if (!business) {
    throw new AuthError("Business not found", 404);
  }

  // Authorize
  if (session.role === UserRole.PARTNER && business.partnerId !== session.userId) {
    throw new AuthError("Unauthorized: You do not have access to this business.", 403);
  }

  const reasons: string[] = [];

  // Check 1: Already Settled
  if (business.status === BusinessStatus.SETTLED) {
    reasons.push("Business is already closed and settled.");
  }

  // Check 2: Check inventory liquidation status
  const inventoryStatus = await getBusinessInventoryLiquidationStatus(businessId);
  const { unsoldInventory, totalUnsoldQuantity, totalCarryingValueAED } = inventoryStatus;

  if (unsoldInventory.length > 0) {
    reasons.push(
      `Cannot close business: ${unsoldInventory.length} product(s) still have remaining unsold inventory (Total: ${totalUnsoldQuantity.toLocaleString()} units, Carrying Value: AED ${totalCarryingValueAED.toLocaleString()}). All sellable inventory must be liquidated before business closure.`
    );
  }

  // Check 3: Check sales records
  const unfinalizedSales = business.sales
    .filter((s) => s.status !== "CLEARED" && s.status !== "PENDING")
    .map((s) => ({
      id: s.id,
      saleCode: s.saleCode,
      status: s.status,
      aedEquivalent: Number(s.aedEquivalent) || 0,
    }));

  if (unfinalizedSales.length > 0) {
    reasons.push(
      `Cannot close business: ${unfinalizedSales.length} sale(s) are in an invalid/unrecognized status.`
    );
  }

  // Check 4: Check expenses
  const pendingExpenses = business.expenses
    .filter((e) => !e.isPurchaseLandedCost && (e.status as string) !== "CLEARED" && (e.status as string) !== "PAID")
    .map((e) => ({
      id: e.id,
      expenseCode: e.expenseCode,
      status: e.status,
      amount: Number(e.amount) || 0,
    }));

  if (pendingExpenses.length > 0) {
    const totalPendingAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
    reasons.push(
      `Cannot close business: ${pendingExpenses.length} expense(s) are pending payment (Total: AED ${totalPendingAmount.toLocaleString()}). All operational expenses must be cleared prior to closure.`
    );
  }

  // Fetch Authoritative Financials
  const { getFullProfitLossData } = await import("@/services/financials/financials.service");

  let netProfitAED = 0;
  let totalRevenueAED = 0;
  let totalPurchasesAED = 0;
  let totalExpensesAED = 0;

  try {
    const pnl = await getFullProfitLossData(session, { businessId });
    totalRevenueAED = Number(pnl.kpis?.totalSalesAED ?? pnl.statement?.totalRevenueAED ?? 0);
    totalPurchasesAED = Number(pnl.kpis?.purchaseCostAED ?? pnl.statement?.totalPurchaseCostAED ?? 0);
    totalExpensesAED = Number(pnl.kpis?.totalExpensesAED ?? pnl.statement?.totalExpensesAED ?? 0);
    netProfitAED = Math.max(0, Number(pnl.kpis?.netProfitAED ?? pnl.statement?.netProfitAED ?? 0));
  } catch (err) {
    console.warn("Could not prefetch PnL for business closure eligibility:", err);
  }

  // Authoritatively compute participant settlement previews in ONE batch query without circular calls
  const allSettlementTxs = await prisma.transaction.findMany({
    where: {
      businessId,
      type: { in: [TransactionType.CAPITAL_RETURN, TransactionType.PROFIT_DISBURSAL] },
    },
    select: {
      investorId: true,
      amount: true,
      type: true,
    },
  });

  const settlementPreviews: ParticipantSettlementPreview[] = [];
  let totalSettlementDueAED = 0;

  for (const inv of business.investments) {
    const committedCapitalAED = Number(inv.committedAmount) || 0;
    const contractualSharePct = Number(inv.profitSharePct) || 0;
    const defaultAllocatedProfitAED =
      netProfitAED > 0 && contractualSharePct > 0
        ? Number(((netProfitAED * contractualSharePct) / 100).toFixed(2))
        : 0;
    const allocatedProfitAED =
      inv.allocatedProfitAmount !== null && inv.allocatedProfitAmount !== undefined
        ? Number(inv.allocatedProfitAmount)
        : defaultAllocatedProfitAED;

    let capitalPaidDec = new Prisma.Decimal(0);
    let profitPaidDec = new Prisma.Decimal(0);

    for (const tx of allSettlementTxs) {
      if (tx.investorId === inv.investorId) {
        if (tx.type === TransactionType.CAPITAL_RETURN) {
          capitalPaidDec = capitalPaidDec.plus(tx.amount);
        } else if (tx.type === TransactionType.PROFIT_DISBURSAL) {
          profitPaidDec = profitPaidDec.plus(tx.amount);
        }
      }
    }

    const capitalPaidAED = Number(capitalPaidDec.toFixed(2));
    const profitPaidAED = Number(profitPaidDec.toFixed(2));
    const outstandingCapitalAED = Math.max(
      0,
      Number(new Prisma.Decimal(committedCapitalAED).minus(capitalPaidDec).toFixed(2))
    );
    const outstandingProfitAED = Math.max(
      0,
      Number(new Prisma.Decimal(allocatedProfitAED).minus(profitPaidDec).toFixed(2))
    );
    const due = Number(
      new Prisma.Decimal(outstandingCapitalAED).plus(new Prisma.Decimal(outstandingProfitAED)).toFixed(2)
    );

    totalSettlementDueAED += due;

    const isExternal = inv.investor.type === "INVESTOR";
    settlementPreviews.push({
      investorId: inv.investorId,
      investorName: inv.investor.name,
      investorCode: inv.investor.code,
      type: inv.investor.type,
      committedCapitalAED,
      contractualSharePct,
      allocatedProfitAED,
      capitalPaidAED,
      profitPaidAED,
      outstandingCapitalAED,
      outstandingProfitAED,
      totalSettlementDueAED: due,
      destination: isExternal ? "INVESTOR_PERSONAL_WALLET" : "DIRECT_BANK_DISBURSAL",
    });
  }

  const isEligible = reasons.length === 0;

  return {
    isEligible,
    businessId: business.id,
    businessName: business.name,
    businessCode: business.code,
    status: business.status,
    unsoldInventory,
    totalUnsoldQuantity,
    totalCarryingValueAED,
    unfinalizedSales,
    pendingExpenses,
    financialSummary: {
      totalRevenueAED,
      totalPurchasesAED,
      totalExpensesAED,
      netProfitAED,
    },
    settlementPreviews,
    totalSettlementDueAED,
    reasons,
  };
}

/**
 * Closes the business, confirms inventory liquidation,
 * and finalizes investor settlement entitlements.
 * Accessible to Admin (manual or automated) or assigned Partner (automated upon liquidation).
 */
export async function closeBusinessAndExecuteFinalSettlement(
  session: SessionPayload,
  businessId: string,
  options?: { isAutomated?: boolean }
) {
  if (session.role !== UserRole.ADMIN && !options?.isAutomated) {
    throw new AuthError("Forbidden: Only system administrators can close a business and execute final settlement.", 403);
  }

  // Idempotency check: If already settled, return cleanly for automated runs
  const preCheck = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, code: true, name: true, status: true, partnerId: true },
  });

  if (!preCheck) {
    throw new AuthError("Business not found", 404);
  }

  if (preCheck.status === BusinessStatus.SETTLED) {
    if (options?.isAutomated) {
      return {
        success: true,
        alreadySettled: true,
        business: preCheck,
        message: `Business ${preCheck.name} (${preCheck.code}) is already closed and settled.`,
      };
    }
    throw new AuthError("Business is already closed and settled.", 400);
  }

  const eligibility = await getBusinessClosureEligibility(session, businessId);
  if (!eligibility.isEligible) {
    throw new AuthError(eligibility.reasons[0] || "Business is not eligible for closure due to unsold inventory.", 400);
  }

  // Atomic state transition with concurrency lock
  const { updatedBusiness, businessEntity, alreadySettled } = await prisma.$transaction(async (tx) => {
    // 1. Concurrency row lock on business record
    const [locked] = await tx.$queryRaw<Array<{ id: string; status: BusinessStatus }>>`
      SELECT id, status FROM "Business" WHERE id = ${businessId} FOR UPDATE
    `;

    if (!locked) {
      throw new AuthError("Business not found", 404);
    }

    if (locked.status === BusinessStatus.SETTLED) {
      const b = await tx.business.findUnique({ where: { id: businessId } });
      return { updatedBusiness: b!, businessEntity: b!, alreadySettled: true };
    }

    // 2. Mark business SETTLED (operationally closed)
    const updated = await tx.business.update({
      where: { id: businessId },
      data: { status: BusinessStatus.SETTLED },
    });

    const businessWithInvestments = await tx.business.findUnique({
      where: { id: businessId },
      include: {
        investments: {
          include: { investor: true },
        },
      },
    });

    if (!businessWithInvestments) {
      throw new AuthError("Business not found during finalization", 404);
    }

    // 3. Finalize / lock profit allocations for each participant if not explicitly set
    const netProfitAED = eligibility.financialSummary.netProfitAED;
    for (const inv of businessWithInvestments.investments) {
      if (inv.allocatedProfitAmount === null || inv.allocatedProfitAmount === undefined) {
        const share = Number(inv.profitSharePct) || 0;
        const alloc = netProfitAED > 0 && share > 0 ? ((netProfitAED * share) / 100).toFixed(2) : "0.00";
        await tx.investment.update({
          where: { id: inv.id },
          data: { allocatedProfitAmount: new Prisma.Decimal(alloc) },
        });
      }
    }

    return { updatedBusiness: updated, businessEntity: businessWithInvestments, alreadySettled: false };
  });

  if (alreadySettled && options?.isAutomated) {
    return {
      success: true,
      alreadySettled: true,
      business: updatedBusiness,
      message: `Business ${updatedBusiness.name} (${updatedBusiness.code}) is already closed and settled.`,
    };
  }

  const netProfitAED = eligibility.financialSummary.netProfitAED;

  const investments =
    "investments" in businessEntity && Array.isArray(businessEntity.investments)
      ? businessEntity.investments
      : [];

  // 4. Audit log operational or automated closure
  await logAuditEvent({
    userId: session.userId,
    action: options?.isAutomated ? "BUSINESS_AUTOMATICALLY_CLOSED" : "BUSINESS_OPERATIONALLY_CLOSED",
    entity: "Business",
    entityId: businessId,
    newValues: {
      businessCode: businessEntity.code,
      status: BusinessStatus.SETTLED,
      netProfitAED,
      totalParticipants: investments.length > 0 ? investments.length : undefined,
      isAutomated: options?.isAutomated || false,
    },
  });

  // 5. Invalidate caches so wallet summaries reflect newly closed business entitlements
  await invalidateBusinessFinancials(businessId, businessEntity.partnerId);
  const { invalidateInvestorCaches } = await import("@/lib/redis/invalidation");
  for (const inv of investments) {
    try {
      await invalidateInvestorCaches(businessId, businessEntity.partnerId, inv.investorId);
    } catch (err) {
      console.warn(`Cache invalidation error for investor ${inv.investorId}:`, err);
    }
  }

  return {
    success: true,
    business: updatedBusiness,
    isAutomated: options?.isAutomated || false,
    message: `Business ${businessEntity.name} (${businessEntity.code}) successfully closed. All investor entitlements are finalized and available for settlement or reinvestment.`,
  };
}

/**
 * Delete a Business entity.
 * Admins cannot delete Partner-owned businesses without Admin participation (403 Forbidden).
 * Owning partners retain existing delete permissions for their own businesses.
 */
export async function deleteBusiness(session: SessionPayload, businessId: string) {
  const existing = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!existing) {
    throw new AuthError("Business not found", 404);
  }

  // View-Only check for Admin on Partner-owned businesses without Admin participation
  if (session.role === UserRole.ADMIN) {
    const isPartnerOwned = await isBusinessPartnerOwnedWithoutAdmin(existing);
    if (isPartnerOwned) {
      await logAuditEvent({
        userId: session.userId,
        action: "UNAUTHORIZED_ACCESS_ATTEMPT",
        entity: "Business",
        entityId: businessId,
        oldValues: {
          reason: "ADMIN_VIEW_ONLY_PARTNER_OWNED_DELETE_ATTEMPT",
        },
      });
      throw new AuthError(
        "This partner-owned business operates without Admin participation and cannot be deleted by administrators.",
        403
      );
    }
  } else if (session.role === UserRole.PARTNER) {
    if (existing.partnerId !== session.userId) {
      throw new AuthError("You do not have permission to delete this business.", 403);
    }
  } else {
    throw new AuthError("You do not have permission to delete businesses.", 403);
  }

  await prisma.business.delete({
    where: { id: businessId },
  });

  await invalidateBusinessFinancials(businessId, existing.partnerId);

  await logAuditEvent({
    userId: session.userId,
    action: "BUSINESS_DELETED",
    entity: "Business",
    entityId: businessId,
    oldValues: {
      name: existing.name,
      code: existing.code,
      partnerId: existing.partnerId,
    },
  });

  return { success: true };
}
