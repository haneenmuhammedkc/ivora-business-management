
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { sanitizeUser, SafeUser } from "@/services/auth/auth.service";
import { validatePhone, normalizePhone } from "@/validators/partner.validator";
import {
  Prisma,
  UserRole,
  UserStatus,
} from "@prisma/client";
import { getOrSetCache } from "@/lib/redis/cache";
import { CacheKeys, CacheTTL } from "@/lib/redis/keys";
import { invalidatePartnerManagementCache } from "@/lib/redis/invalidation";
import { PartnerProfitShareItem } from "@/types/settings";


export interface CreatePartnerInput {
  adminUserId: string;
  name: string;
  email: string;
  phone?: string;
  temporaryPassword?: string;
  businessId?: string;
  partnerEquityPct?: number;
  ipAddress?: string;
}

export interface CreatePartnerResult {
  success: boolean;
  partner?: SafeUser & { assignedBusinessId?: string; phone?: string | null };
  temporaryPassword?: string;
  error?: string;
}

/**
 * Generate a random secure temporary password.
 */
function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let pwd = "Iv1!";
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

/**
 * Admin service to create and onboard a new Partner account.
 */
export async function createPartnerUser(input: CreatePartnerInput): Promise<CreatePartnerResult> {
  const { adminUserId, name, email, phone, businessId, partnerEquityPct, ipAddress } = input;

  if (!name || !email) {
    return { success: false, error: "Partner name and email are required" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Verify email uniqueness
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return { success: false, error: "A user account with this email already exists" };
  }

  if (phone) {
    const phoneError = validatePhone(phone);
    if (phoneError) {
      return { success: false, error: phoneError };
    }
  }

  const normalizedPhone = normalizePhone(phone);

  const rawTemporaryPassword = input.temporaryPassword?.trim() || generateTemporaryPassword();
  const strength = validatePasswordStrength(rawTemporaryPassword);
  if (!strength.valid) {
    return { success: false, error: `Temporary password invalid: ${strength.error}` };
  }

  // If businessId is provided, verify business exists
  if (businessId) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      return { success: false, error: `Assigned business with ID ${businessId} not found` };
    }
  }

  const passwordHash = await hashPassword(rawTemporaryPassword);

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Create Partner user (ACTIVE with mandatory password change on first login)
    const newPartner = await tx.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        phone: normalizedPhone,
        passwordHash,
        role: UserRole.PARTNER,
        status: UserStatus.ACTIVE,
        mustChangePassword: true,
      },
    });

    // 2. Link to business if specified
    if (businessId) {
      await tx.business.update({
        where: { id: businessId },
        data: {
          partnerId: newPartner.id,
          ...(partnerEquityPct !== undefined ? { partnerEquityPct } : {}),
        },
      });
    }

    return newPartner;
  });

  // 3. Audit Log
  await logAuditEvent({
    userId: adminUserId,
    action: "PARTNER_CREATED",
    entity: "User",
    entityId: result.id,
    newValues: {
      email: normalizedEmail,
      name: name.trim(),
      phone: normalizedPhone,
      role: UserRole.PARTNER,
      assignedBusinessId: businessId || null,
    },
    ipAddress,
  });

  return {
    success: true,
    partner: {
      ...sanitizeUser(result),
      phone: normalizedPhone,
      assignedBusinessId: businessId,
    },
    temporaryPassword: rawTemporaryPassword,
  };
}

/**
 * List all Partners for Admin view.
 */
export async function listPartners() {
  const partners = await prisma.user.findMany({
    where: { role: UserRole.PARTNER },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      businesses: {
        select: {
          id: true,
          name: true,
          code: true,
          partnerEquityPct: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return partners;
}

/**
 * Get Partner details by ID.
 */
export async function getPartnerById(partnerId: string) {
  const partner = await prisma.user.findFirst({
    where: { id: partnerId, role: UserRole.PARTNER },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      businesses: {
        select: {
          id: true,
          name: true,
          code: true,
          partnerEquityPct: true,
          status: true,
        },
      },
    },
  });

  return partner;
}

/**
 * Update Partner profile details (name and phone).
 */
export async function updatePartnerProfile(params: {
  adminUserId: string;
  partnerId: string;
  name: string;
  phone?: string | null;
  ipAddress?: string;
}): Promise<{ success: boolean; partner?: SafeUser & { phone?: string | null }; error?: string }> {
  const { adminUserId, partnerId, name, phone, ipAddress } = params;

  const partner = await prisma.user.findFirst({
    where: { id: partnerId, role: UserRole.PARTNER },
  });

  if (!partner) {
    return { success: false, error: "Partner account not found" };
  }

  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) {
    return { success: false, error: "Partner name is required" };
  }

  if (phone) {
    const phoneError = validatePhone(phone);
    if (phoneError) {
      return { success: false, error: phoneError };
    }
  }

  const cleanPhone = normalizePhone(phone);

  const oldValues = {
    name: partner.name,
    phone: partner.phone,
  };

  const updatedPartner = await prisma.user.update({
    where: { id: partnerId },
    data: {
      name: cleanName,
      phone: cleanPhone,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      mustChangePassword: true,
      passwordChangedAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: "PARTNER_PROFILE_UPDATED",
    entity: "User",
    entityId: partnerId,
    oldValues,
    newValues: {
      name: cleanName,
      phone: cleanPhone,
    },
    ipAddress,
  });

  await invalidatePartnerManagementCache();

  return {
    success: true,
    partner: updatedPartner,
  };
}

/**
 * Update Partner account status (ACTIVE, INACTIVE, SUSPENDED).
 */
export async function updatePartnerStatus(params: {
  adminUserId: string;
  partnerId: string;
  status: UserStatus;
  ipAddress?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { adminUserId, partnerId, status, ipAddress } = params;

  const partner = await prisma.user.findFirst({
    where: { id: partnerId, role: UserRole.PARTNER },
  });

  if (!partner) {
    return { success: false, error: "Partner account not found" };
  }

  // Prevent manually activating a partner whose status is PENDING_ACTIVATION without completing email OTP verification
  if (partner.status === UserStatus.PENDING_ACTIVATION && status === UserStatus.ACTIVE) {
    return {
      success: false,
      error: "Cannot activate partner account while pending verification. Partner must complete account activation via OTP.",
    };
  }

  // Allowed target statuses for partner management
  const allowedStatuses: UserStatus[] = [
    UserStatus.ACTIVE,
    UserStatus.INACTIVE,
    UserStatus.SUSPENDED,
  ];

  if (!allowedStatuses.includes(status)) {
    return {
      success: false,
      error: `Invalid status for partner. Allowed statuses: ${allowedStatuses.join(", ")}`,
    };
  }

  // If status is unchanged, return success directly
  if (partner.status === status) {
    return { success: true };
  }

  await prisma.user.update({
    where: { id: partnerId },
    data: { status },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: "PARTNER_STATUS_CHANGED",
    entity: "User",
    entityId: partnerId,
    oldValues: { status: partner.status },
    newValues: { status },
    ipAddress,
  });

  // Invalidate Redis caches so Settings and Profile remain synchronized
  await invalidatePartnerManagementCache();

  return { success: true };
}

/**
 * Fetch authoritative Partner Management data for Settings.
 * - Computes Paid-In Capital from authoritative Investment / Business records (no double-counting)
 * - Computes Profit Split Weight from effective rules / override
 * - Computes Allocated Profit using established Ivora net spread & partner equity
 * - Computes Outstanding Payout (Allocated Profit minus recorded PROFIT_DISBURSAL transactions)
 * - Persists and returns Override Status
 */
export async function getPartnerManagementData(): Promise<PartnerProfitShareItem[]> {
  const cacheKey = CacheKeys.settings.partnerManagement();

  return getOrSetCache(cacheKey, CacheTTL.SHORT, async () => {
    // 1. Fetch all partners with role PARTNER
    const partners = await prisma.user.findMany({
      where: { role: UserRole.PARTNER },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        manualProfitShareOverride: true,
        businesses: {
          select: {
            id: true,
            name: true,
            code: true,
            totalInvestmentAED: true,
            adminInvestmentAED: true,
            partnerInvestmentAED: true,
            partnerEquityPct: true,
            status: true,
            sales: {
              select: {
                aedEquivalent: true,
              },
            },
            purchases: {
              select: {
                totalLandedCost: true,
              },
            },
            expenses: {
              where: { isPurchaseLandedCost: false },
              select: {
                amount: true,
              },
            },
            transactions: {
              where: { type: "PROFIT_DISBURSAL" },
              select: {
                amount: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const result: PartnerProfitShareItem[] = [];

    for (const partner of partners) {
      const assignedBusinessesList = partner.businesses.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        partnerEquityPct: Number(b.partnerEquityPct || 0),
      }));

      // Assigned business display text
      let assignedBusinessText = "No assigned business";
      if (assignedBusinessesList.length === 1) {
        assignedBusinessText = `${assignedBusinessesList[0].name} (${assignedBusinessesList[0].code})`;
      } else if (assignedBusinessesList.length > 1) {
        assignedBusinessText = assignedBusinessesList
          .map((b) => `${b.name} (${b.code})`)
          .join(", ");
      }

      // Aggregate Paid-In Capital across assigned businesses
      let totalPaidInCapital = 0;
      let totalEffectiveSharePct = 0;
      let totalAllocatedProfit = 0;
      let totalDisbursed = 0;

      for (const biz of partner.businesses) {
        const pInv = Number(biz.partnerInvestmentAED || 0);
        totalPaidInCapital += pInv;

        const equityPct = Number(biz.partnerEquityPct || 0);
        totalEffectiveSharePct += equityPct;

        // Financial allocation calculation
        const bSales = biz.sales.reduce((acc, s) => acc + Number(s.aedEquivalent || 0), 0);
        const bPurchases = biz.purchases.reduce((acc, p) => acc + Number(p.totalLandedCost || 0), 0);
        const bExpenses = biz.expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
        const bNetProfit = bSales - (bPurchases + bExpenses);

        const bizAllocatedProfit = bNetProfit > 0 && equityPct > 0 ? (bNetProfit * equityPct) / 100 : 0;
        totalAllocatedProfit += bizAllocatedProfit;

        const bizDisbursed = biz.transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
        totalDisbursed += bizDisbursed;
      }

      // Effective profit split weight
      // If multiple businesses, show sum or average depending on representation; here average if > 0 or direct sum
      const effectiveSplitWeight =
        partner.businesses.length > 1
          ? Number((totalEffectiveSharePct / partner.businesses.length).toFixed(2))
          : Number(totalEffectiveSharePct.toFixed(2));

      // Outstanding payout: non-negative allocated minus disbursed
      const roundedAllocated = Math.round(totalAllocatedProfit * 100) / 100;
      const roundedDisbursed = Math.round(totalDisbursed * 100) / 100;
      const outstandingPayout = Math.max(0, Math.round((roundedAllocated - roundedDisbursed) * 100) / 100);

      const isOverrideEnabled = Boolean(partner.manualProfitShareOverride);

      result.push({
        id: partner.id,
        partnerEntity: partner.name,
        email: partner.email,
        assignedBusiness: assignedBusinessText,
        assignedBusinesses: assignedBusinessesList,
        paidInCapitalAED: totalPaidInCapital,
        profitSplitWeightPercent: effectiveSplitWeight,
        allocatedProfitAED: roundedAllocated,
        outstandingPayoutAED: outstandingPayout,
        overrideStatus: isOverrideEnabled ? "MANUAL LOCK" : "DEFAULT",
        overrideEnabled: isOverrideEnabled,
      });
    }

    return result;
  });
}

/**
 * Toggle Partner Manual Profit Share Override (ADMIN ONLY).
 */
export async function updatePartnerProfitShareOverride(params: {
  adminUserId: string;
  partnerId: string;
  overrideEnabled: boolean;
  ipAddress?: string;
}): Promise<{ success: boolean; partner?: { id: string; overrideEnabled: boolean }; error?: string }> {
  const { adminUserId, partnerId, overrideEnabled, ipAddress } = params;

  const partner = await prisma.user.findFirst({
    where: { id: partnerId, role: UserRole.PARTNER },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      manualProfitShareOverride: true,
    },
  });

  if (!partner) {
    return { success: false, error: "Partner account not found" };
  }

  const oldOverride = partner.manualProfitShareOverride;

  if (oldOverride === overrideEnabled) {
    return {
      success: true,
      partner: {
        id: partner.id,
        overrideEnabled: partner.manualProfitShareOverride,
      },
    };
  }

  // Update override field safely
  const updatedUser = await prisma.user.update({
    where: { id: partnerId },
    data: {
      manualProfitShareOverride: overrideEnabled,
    },
    select: {
      id: true,
      manualProfitShareOverride: true,
    },
  });

  // Write audit log
  await logAuditEvent({
    userId: adminUserId,
    action: "PARTNER_PROFIT_SHARE_OVERRIDE_CHANGED",
    entity: "User",
    entityId: partnerId,
    oldValues: { manualProfitShareOverride: oldOverride },
    newValues: { manualProfitShareOverride: overrideEnabled },
    ipAddress,
  });

  // Invalidate Redis caches
  await invalidatePartnerManagementCache();

  return {
    success: true,
    partner: {
      id: updatedUser.id,
      overrideEnabled: updatedUser.manualProfitShareOverride,
    },
  };
}

