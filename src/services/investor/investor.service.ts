import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess } from "@/lib/auth/authorization";
import { AuthError } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, UserRole, InvestorType } from "@prisma/client";
import { getOrSetCache } from "@/lib/redis/cache";
import { CacheKeys, CacheTTL } from "@/lib/redis/keys";
import { invalidateInvestorCaches } from "@/lib/redis/invalidation";
import {
  InvestorRecord,
  InvestorStatus,
  InvestorSummaryKPIs,
  BusinessInvestorRow,
  BusinessInvestorDetails,
} from "@/types/investors";

export interface CreateInvestorInput {
  name: string;
  code?: string;
  email?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  businessId: string;
  investmentAmount?: number | string;
  investmentCapitalAED?: number | string;
  committedAmount?: number | string;
  defaultSharePct?: number | string;
  status?: string;
}

export interface UpdateInvestorInput {
  name?: string;
  email?: string;
  phone?: string;
  defaultSharePct?: number;
  status?: string;
}

/**
 * Generate a unique investor code (INV-001, INV-002, etc.).
 */
export async function generateUniqueInvestorCode(): Promise<string> {
  const count = await prisma.investor.count();
  let num = count + 1;
  let code = `INV-${String(num).padStart(3, "0")}`;
  while (await prisma.investor.findUnique({ where: { code } })) {
    num++;
    code = `INV-${String(num).padStart(3, "0")}`;
  }
  return code;
}

/**
 * Format a date object to UK standard string e.g. "24 Sep 2026".
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Idempotently synchronize Admin and Partner participant records in the database
 * for a specific Business entity.
 */
export async function ensureBusinessParticipants(businessId: string) {
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
    },
  });

  if (!business) return;

  const adminCode = `INV-ADM-${business.code}`;
  const partnerCode = `INV-PTR-${business.code}`;

  const adminInvVal = new Prisma.Decimal(business.adminInvestmentAED);
  const partnerInvVal = new Prisma.Decimal(business.partnerInvestmentAED);
  const partnerEquityVal = new Prisma.Decimal(business.partnerEquityPct);

  // 1. ADMIN PARTICIPANT (Only if adminInvestmentAED > 0)
  if (adminInvVal.gt(0)) {
    let adminInvestor = await prisma.investor.findUnique({
      where: { code: adminCode },
    });

    if (!adminInvestor) {
      adminInvestor = await prisma.investor.create({
        data: {
          name: "Ivora Admin",
          code: adminCode,
          type: InvestorType.ADMIN,
          email: "admin@ivora.trade",
          businessId: business.id,
          defaultSharePct: null,
          status: "ACTIVE",
        },
      });
    } else {
      adminInvestor = await prisma.investor.update({
        where: { id: adminInvestor.id },
        data: {
          type: InvestorType.ADMIN,
          businessId: business.id,
          status: "ACTIVE",
        },
      });
    }

    // Ensure Admin Investment entry
    const existingAdminInvestment = await prisma.investment.findFirst({
      where: { investorId: adminInvestor.id, businessId: business.id },
    });

    if (!existingAdminInvestment) {
      await prisma.investment.create({
        data: {
          investorId: adminInvestor.id,
          businessId: business.id,
          committedAmount: adminInvVal,
          profitSharePct: new Prisma.Decimal(0),
          depositDate: business.createdAt,
          status: "ACTIVE",
        },
      });
    } else {
      await prisma.investment.update({
        where: { id: existingAdminInvestment.id },
        data: {
          committedAmount: adminInvVal,
        },
      });
    }
  } else {
    // If admin investment is 0 or negative, clean up any auto-generated admin participant records
    const adminInvestor = await prisma.investor.findUnique({
      where: { code: adminCode },
    });
    if (adminInvestor) {
      await prisma.investment.deleteMany({
        where: { investorId: adminInvestor.id, businessId: business.id },
      });
      await prisma.investor.delete({
        where: { id: adminInvestor.id },
      }).catch(() => {});
    }
  }

  // 2. PARTNER PARTICIPANT (Only if partnerInvestmentAED > 0)
  if (partnerInvVal.gt(0)) {
    let partnerInvestor = await prisma.investor.findUnique({
      where: { code: partnerCode },
    });

    const partnerName = business.partner?.name || "Partner";
    const partnerEmail = business.partner?.email || null;

    if (!partnerInvestor) {
      partnerInvestor = await prisma.investor.create({
        data: {
          name: partnerName,
          code: partnerCode,
          type: InvestorType.PARTNER,
          email: partnerEmail,
          businessId: business.id,
          defaultSharePct: partnerEquityVal,
          status: "ACTIVE",
        },
      });
    } else {
      partnerInvestor = await prisma.investor.update({
        where: { id: partnerInvestor.id },
        data: {
          name: partnerName,
          email: partnerEmail,
          type: InvestorType.PARTNER,
          businessId: business.id,
          defaultSharePct: partnerEquityVal,
          status: "ACTIVE",
        },
      });
    }

    // Ensure Partner Investment entry
    const existingPartnerInvestment = await prisma.investment.findFirst({
      where: { investorId: partnerInvestor.id, businessId: business.id },
    });

    if (!existingPartnerInvestment) {
      await prisma.investment.create({
        data: {
          investorId: partnerInvestor.id,
          businessId: business.id,
          committedAmount: partnerInvVal,
          profitSharePct: partnerEquityVal,
          depositDate: business.createdAt,
          status: "ACTIVE",
        },
      });
    } else {
      await prisma.investment.update({
        where: { id: existingPartnerInvestment.id },
        data: {
          committedAmount: partnerInvVal,
          profitSharePct: partnerEquityVal,
        },
      });
    }
  } else {
    // If partner investment is 0 or negative, clean up any auto-generated partner participant records
    const partnerInvestor = await prisma.investor.findUnique({
      where: { code: partnerCode },
    });
    if (partnerInvestor) {
      await prisma.investment.deleteMany({
        where: { investorId: partnerInvestor.id, businessId: business.id },
      });
      await prisma.investor.delete({
        where: { id: partnerInvestor.id },
      }).catch(() => {});
    }
  }
}

/**
 * List Businesses for the main Investor page (One Row per Business).
 */
export async function listBusinessInvestorRows(session: SessionPayload) {
  const cacheKey = CacheKeys.investors.overview(session.role, session.userId);

  return getOrSetCache(cacheKey, CacheTTL.LONG, async () => {
    let businessWhere: Prisma.BusinessWhereInput = {};

    if (session.role !== UserRole.ADMIN) {
      businessWhere = { partnerId: session.userId };
    }

    const businesses = await prisma.business.findMany({
      where: businessWhere,
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        investors: {
          select: {
            id: true,
            type: true,
          },
        },
        investments: {
          include: {
            investor: {
              select: {
                id: true,
                type: true,
              },
            },
          },
        },
        sales: {
          select: { aedEquivalent: true },
        },
        purchases: {
          select: { totalLandedCost: true },
        },
        expenses: {
          select: { amount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Ensured participant records exist via write-time synchronization (createBusiness/updateBusiness)

    let totalInvestmentSum = 0;
    let totalNetRealizedProfit = 0;
    let totalExternalInvestorsSum = 0;

    const businessRows: BusinessInvestorRow[] = businesses.map((b) => {
      const totalInv = Number(b.totalInvestmentAED) || 0;
      const adminInv = Number(b.adminInvestmentAED) || 0;
      const partnerInv = Number(b.partnerInvestmentAED) || 0;
      const partnerEquity = Number(b.partnerEquityPct) || 0;

      totalInvestmentSum += totalInv;

      const salesTotal = b.sales.reduce((acc, s) => acc + Number(s.aedEquivalent), 0);
      const purchaseCost = b.purchases.reduce((acc, p) => acc + Number(p.totalLandedCost), 0);
      const expensesCost = b.expenses.reduce((acc, e) => acc + Number(e.amount), 0);
      const netProfit = salesTotal - purchaseCost - expensesCost;
      if (netProfit > 0) {
        totalNetRealizedProfit += netProfit;
      }

      // Count external investors only (type === INVESTOR with committedAmount > 0)
      const externalInvestors = b.investments.filter(
        (inv) => inv.investor.type === InvestorType.INVESTOR && Number(inv.committedAmount) > 0
      );
      const externalCount = externalInvestors.length;
      totalExternalInvestorsSum += externalCount;

      const totalParticipantsCount =
        (adminInv > 0 ? 1 : 0) + (partnerInv > 0 ? 1 : 0) + externalCount;

      return {
        id: b.id,
        name: b.name,
        code: b.code,
        businessType: b.businessType || "Trading",
        description: b.description,
        totalInvestmentAED: totalInv,
        adminInvestmentAED: adminInv,
        partnerInvestmentAED: partnerInv,
        partnerEquityPct: partnerEquity,
        partnerId: b.partnerId,
        partnerName: b.partner?.name || "Partner",
        externalInvestorsCount: externalCount,
        totalParticipantsCount,
        status: b.status,
        createdAt: formatDate(new Date(b.createdAt)),
      };
    });

    const kpis: InvestorSummaryKPIs = {
      totalInvestors: totalExternalInvestorsSum,
      totalInvestmentAED: totalInvestmentSum,
      profitPaid: 0,
      netRealizedProfitAED: totalNetRealizedProfit,
    };

    return {
      businesses: businessRows,
      kpis,
    };
  });
}

/**
 * Fetch a single Business and all its investment participants (Admin, Partner, External Investors)
 * belonging to that Business in the same list.
 */
export async function getBusinessInvestorDetails(
  session: SessionPayload,
  businessId: string
): Promise<{ business: BusinessInvestorDetails; kpis: InvestorSummaryKPIs }> {
  await requireBusinessAccess(businessId, session);

  const cacheKey = CacheKeys.investors.business(businessId);

  return getOrSetCache(cacheKey, CacheTTL.LONG, async () => {
    const b = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        investments: {
          include: {
            investor: true,
          },
          orderBy: { createdAt: "desc" },
        },
        investors: {
          include: {
            investments: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!b) {
      throw new AuthError("Business not found", 404);
    }

    const businessDateFormatted = formatDate(new Date(b.createdAt));
    const adminInvestmentVal = Number(b.adminInvestmentAED) || 0;
    const partnerInvestmentVal = Number(b.partnerInvestmentAED) || 0;
    const partnerEquityVal = Number(b.partnerEquityPct) || 0;
    const partnerName = b.partner?.name || "Partner";

    const participants: InvestorRecord[] = [];

    // 1. ADMIN PARTICIPANT (Only included if adminInvestmentVal > 0)
    if (adminInvestmentVal > 0) {
      participants.push({
        id: `admin-${b.id}`,
        participantType: "ADMIN",
        name: "Ivora Admin",
        code: `INV-ADM-${b.code}`,
        emailOrSubtitle: "admin@ivora.trade",
        businessId: b.id,
        business: b.name,
        businessEntity: `${b.code} • ${b.businessType || "Trading"}`,
        entityLabel: `${b.name} (${b.code}) • ADMIN`,
        investmentAED: adminInvestmentVal,
        date: businessDateFormatted,
        sharePercent: null, // Admin share percentage not defined as ratio in table
        allocatedProfitAED: 0,
        paidAED: 0,
        outstandingAED: 0,
        status: "ACTIVE" as InvestorStatus,
        selected: false,
        details: {
          totalInvestmentAED: adminInvestmentVal,
          profitShare: "—",
          profitShareContract: "System Admin Capital Account",
          allocatedProfit: 0,
          outstandingBalance: 0,
          paidAmount: 0,
          recentTransactions: [
            {
              id: `CAP-ADM-${b.code}`,
              title: "Admin Initial Capital",
              date: businessDateFormatted,
              reference: `Direct Treasury (${b.code})`,
              amountFormatted: `AED ${adminInvestmentVal.toLocaleString()} Cleared`,
              type: "INWARD REMITTANCE",
            },
          ],
        },
      });
    }

    // 2. PARTNER PARTICIPANT (Only included if partnerInvestmentVal > 0)
    if (partnerInvestmentVal > 0) {
      participants.push({
        id: `partner-${b.id}-${b.partnerId}`,
        participantType: "PARTNER",
        name: partnerName,
        code: `INV-PTR-${b.code}`,
        emailOrSubtitle: b.partner?.email ? b.partner.email : "PARTNER • Operating Stake",
        businessId: b.id,
        business: b.name,
        businessEntity: `${b.code} • Partner Equity`,
        entityLabel: `${b.name} (${b.code}) • PARTNER`,
        investmentAED: partnerInvestmentVal,
        date: businessDateFormatted,
        sharePercent: partnerEquityVal,
        allocatedProfitAED: 0,
        paidAED: 0,
        outstandingAED: 0,
        status: "ACTIVE" as InvestorStatus,
        selected: false,
        details: {
          totalInvestmentAED: partnerInvestmentVal,
          profitShare: `${partnerEquityVal}%`,
          profitShareContract: `Partner Equity (${partnerEquityVal}%)`,
          allocatedProfit: 0,
          outstandingBalance: 0,
          paidAmount: 0,
          recentTransactions: [
            {
              id: `CAP-PTR-${b.code}`,
              title: "Partner Capital Contribution",
              date: businessDateFormatted,
              reference: `Partner Escrow (${b.code})`,
              amountFormatted: `AED ${partnerInvestmentVal.toLocaleString()} Cleared`,
              type: "INWARD REMITTANCE",
            },
          ],
        },
      });
    }

    // 3. EXTERNAL INVESTORS (Only included if committedAmount > 0)
    let totalExternalInvestmentVal = 0;

    for (const inv of b.investments) {
      if (inv.investor.type !== InvestorType.INVESTOR) continue;
      const amountVal = Number(inv.committedAmount) || 0;
      if (amountVal <= 0) continue;

      const invDateFormatted = formatDate(new Date(inv.depositDate || inv.createdAt));
      const shareVal = Number(inv.profitSharePct) || 0;
      totalExternalInvestmentVal += amountVal;

      participants.push({
        id: inv.investor.id,
        participantType: "INVESTOR",
        name: inv.investor.name,
        code: inv.investor.code,
        emailOrSubtitle: `${inv.investor.code} • ${inv.investor.email || "investor@ivora-trade.ae"}`,
        businessId: b.id,
        business: b.name,
        businessEntity: `${b.code} • External Capital`,
        entityLabel: `${b.name} (${b.code}) • ${inv.investor.code}`,
        investmentAED: amountVal,
        date: invDateFormatted,
        sharePercent: shareVal,
        allocatedProfitAED: 0,
        paidAED: 0,
        outstandingAED: 0,
        status: (inv.status || inv.investor.status || "ACTIVE") as InvestorStatus,
        selected: false,
        details: {
          totalInvestmentAED: amountVal,
          profitShare: `${shareVal}%`,
          profitShareContract: `Standard Contract (${shareVal}%)`,
          allocatedProfit: 0,
          outstandingBalance: 0,
          paidAmount: 0,
          recentTransactions: [
            {
              id: `CAP-${inv.investor.code}`,
              title: "External Investment Capital",
              date: invDateFormatted,
              reference: `Escrow Account (${b.code})`,
              amountFormatted: `AED ${amountVal.toLocaleString()} Cleared`,
              type: "INWARD REMITTANCE",
            },
          ],
        },
      });
    }

  const businessDetails: BusinessInvestorDetails = {
    id: b.id,
    name: b.name,
    code: b.code,
    businessType: b.businessType || "Trading",
    description: b.description,
    totalInvestmentAED: Number(b.totalInvestmentAED) || 0,
    adminInvestmentAED: adminInvestmentVal,
    partnerInvestmentAED: partnerInvestmentVal,
    partnerEquityPct: partnerEquityVal,
    partner: {
      id: b.partner.id,
      name: b.partner.name,
      email: b.partner.email,
    },
    totalExternalInvestmentAED: totalExternalInvestmentVal,
    status: b.status,
    createdAt: businessDateFormatted,
    participants,
  };

  const kpis: InvestorSummaryKPIs = {
    totalInvestors: participants.filter((p) => p.participantType === "INVESTOR").length,
    totalInvestmentAED: Number(b.totalInvestmentAED) || 0,
    profitPaid: 0,
    netRealizedProfitAED: 0,
  };

    return {
      business: businessDetails,
      kpis,
    };
  });
}

/**
 * Backward-compatible listInvestors method.
 */
export async function listInvestors(session: SessionPayload, businessId?: string) {
  if (businessId && businessId !== "all") {
    const details = await getBusinessInvestorDetails(session, businessId);
    return {
      participants: details.business.participants,
      kpis: details.kpis,
      rawInvestors: await prisma.investor.findMany({
        where: { businessId },
        include: { business: true, investments: true },
      }),
    };
  }

  const rows = await listBusinessInvestorRows(session);
  return {
    businesses: rows.businesses,
    kpis: rows.kpis,
  };
}

/**
 * Fetch a single Investor or Participant by ID.
 */
export async function getInvestorById(session: SessionPayload, investorId: string) {
  if (investorId.startsWith("admin-")) {
    const businessId = investorId.replace("admin-", "");
    await requireBusinessAccess(businessId, session);
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { partner: true },
    });
    if (!business) throw new AuthError("Business not found", 404);
    return {
      id: investorId,
      participantType: "ADMIN",
      name: "Ivora Admin",
      businessId: business.id,
      business: business.name,
      investmentAED: Number(business.adminInvestmentAED),
      status: "ACTIVE",
    };
  }

  if (investorId.startsWith("partner-")) {
    const parts = investorId.split("-");
    const businessId = parts[1];
    await requireBusinessAccess(businessId, session);
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { partner: true },
    });
    if (!business) throw new AuthError("Business not found", 404);
    return {
      id: investorId,
      participantType: "PARTNER",
      name: business.partner?.name || "Partner",
      businessId: business.id,
      business: business.name,
      investmentAED: Number(business.partnerInvestmentAED),
      sharePercent: Number(business.partnerEquityPct),
      status: "ACTIVE",
    };
  }

  const { resource } = await requireResourceAccess("Investor", investorId, "READ", session);
  return resource;
}

/**
 * Register a new external Investor and record their investment against an existing Business.
 * The server calculates the authoritative equity percentage based on Business.totalInvestmentAED.
 * Total investment of the business remains unchanged.
 */
export async function createInvestor(session: SessionPayload, input: CreateInvestorInput) {
  const {
    name,
    email,
    contactEmail,
    phone,
    businessId,
    investmentAmount,
    investmentCapitalAED,
    committedAmount,
    code,
    status,
  } = input;

  // Validation: Investor name
  if (!name || !name.trim()) {
    throw new AuthError("Investor name is required.", 400);
  }

  // Validation: Business selection
  if (!businessId || !businessId.trim()) {
    throw new AuthError("Please select a valid assigned business entity.", 400);
  }

  // Enforce access control for the selected business
  await requireBusinessAccess(businessId.trim(), session);

  // Load business from database to retrieve authoritative totalInvestmentAED
  const business = await prisma.business.findUnique({
    where: { id: businessId.trim() },
    select: {
      id: true,
      name: true,
      code: true,
      totalInvestmentAED: true,
      status: true,
    },
  });

  if (!business) {
    throw new AuthError("Selected business does not exist.", 404);
  }

  const businessTotalInvestment = Number(business.totalInvestmentAED) || 0;
  if (businessTotalInvestment <= 0) {
    throw new AuthError("Assigned business has no valid total investment capital.", 400);
  }

  // Parse and validate investment capital
  const rawCapital = investmentCapitalAED ?? investmentAmount ?? committedAmount;
  const capitalNum = Number(rawCapital);
  if (rawCapital === undefined || rawCapital === null || isNaN(capitalNum) || capitalNum <= 0) {
    throw new AuthError("Please provide a valid investment capital amount greater than 0.", 400);
  }

  // Authoritative server-side calculation:
  // Investor Equity % = (Investor Investment Capital / Business.totalInvestmentAED) * 100
  const calculatedEquityPct = Number(((capitalNum / businessTotalInvestment) * 100).toFixed(2));

  // Determine unique investor code
  let finalCode = code?.trim().toUpperCase();
  if (!finalCode) {
    finalCode = await generateUniqueInvestorCode();
  } else {
    const existingCode = await prisma.investor.findUnique({
      where: { code: finalCode },
    });
    if (existingCode) {
      throw new AuthError(`Investor code ${finalCode} is already registered.`, 409);
    }
  }

  const contactEmailVal = (email || contactEmail)?.trim() || null;

  // Persist external Investor with type INVESTOR
  const investor = await prisma.investor.create({
    data: {
      name: name.trim(),
      code: finalCode,
      email: contactEmailVal,
      phone: phone?.trim() || null,
      type: InvestorType.INVESTOR,
      defaultSharePct: new Prisma.Decimal(calculatedEquityPct),
      businessId: business.id,
      status: status || "ACTIVE",
    },
    include: {
      business: { select: { id: true, name: true, code: true, totalInvestmentAED: true } },
    },
  });

  // Persist Investment record
  const investment = await prisma.investment.create({
    data: {
      investorId: investor.id,
      businessId: business.id,
      committedAmount: new Prisma.Decimal(capitalNum),
      profitSharePct: new Prisma.Decimal(calculatedEquityPct),
      depositDate: new Date(),
      status: "ACTIVE",
    },
  });

  // Log audit events
  await logAuditEvent({
    userId: session.userId,
    action: "INVESTOR_CREATED",
    entity: "Investor",
    entityId: investor.id,
    newValues: {
      name: investor.name,
      code: investor.code,
      type: investor.type,
      businessId: business.id,
      businessName: business.name,
      investmentCapitalAED: capitalNum,
      calculatedEquityPct,
    },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "INVESTMENT_CREATED",
    entity: "Investment",
    entityId: investment.id,
    newValues: {
      investorId: investor.id,
      businessId: business.id,
      committedAmount: capitalNum,
      profitSharePct: calculatedEquityPct,
    },
  });

  // Invalidate Redis caches
  await invalidateInvestorCaches(business.id);

  return {
    investor,
    investment,
    equityPct: calculatedEquityPct,
  };
}

/**
 * Update an external Investor's details.
 */
export async function updateInvestor(session: SessionPayload, investorId: string, input: UpdateInvestorInput) {
  await requireResourceAccess("Investor", investorId, "WRITE", session);

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

  // Invalidate Redis caches
  if (updated.businessId) {
    await invalidateInvestorCaches(updated.businessId);
  }

  return updated;
}
