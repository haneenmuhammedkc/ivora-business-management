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
            phone: true,
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
    const totalInvestmentVal = Number(b.totalInvestmentAED) || 0;
    const adminInvestmentVal = Number(b.adminInvestmentAED) || 0;
    const partnerInvestmentVal = Number(b.partnerInvestmentAED) || 0;
    const partnerEquityVal = Number(b.partnerEquityPct) || 0;
    const partnerName = b.partner?.name || "Partner";

    const adminShareVal =
      totalInvestmentVal > 0 && adminInvestmentVal > 0
        ? Number(((adminInvestmentVal / totalInvestmentVal) * 100).toFixed(2))
        : 0;

    const participants: InvestorRecord[] = [];

    // 1. ADMIN PARTICIPANT (Only included if adminInvestmentVal > 0)
    if (adminInvestmentVal > 0) {
      participants.push({
        id: `admin-${b.id}`,
        participantType: "ADMIN",
        name: "Ivora Admin",
        code: `INV-ADM-${b.code}`,
        email: "admin@ivora.trade",
        phone: null,
        emailOrSubtitle: "admin@ivora.trade",
        businessId: b.id,
        business: b.name,
        businessEntity: `${b.code} • ${b.businessType || "Trading"}`,
        entityLabel: `${b.name} (${b.code}) • ADMIN`,
        investmentAED: adminInvestmentVal,
        date: businessDateFormatted,
        sharePercent: adminShareVal,
        allocatedProfitAED: 0,
        paidAED: 0,
        outstandingAED: 0,
        status: "ACTIVE" as InvestorStatus,
        selected: false,
        details: {
          totalInvestmentAED: adminInvestmentVal,
          profitShare: `${adminShareVal}%`,
          profitShareContract: `Admin Treasury Allocation (${adminShareVal}%)`,
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
        email: b.partner?.email || null,
        phone: b.partner?.phone || null,
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
        email: inv.investor.email || null,
        phone: inv.investor.phone || null,
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
export async function getInvestorById(session: SessionPayload, investorId: string): Promise<InvestorRecord> {
  // 1. Enforce RBAC and business/resource access before cache lookup
  if (investorId.startsWith("admin-")) {
    const businessId = investorId.replace("admin-", "");
    await requireBusinessAccess(businessId, session);
  } else if (investorId.startsWith("partner-")) {
    const parts = investorId.split("-");
    const businessId = parts[1];
    await requireBusinessAccess(businessId, session);
  } else {
    await requireResourceAccess("Investor", investorId, "READ", session);
  }

  const cacheKey = CacheKeys.investors.detail(investorId);

  return getOrSetCache(cacheKey, CacheTTL.LONG, async () => {
    // 1. Synthetic ADMIN participant
    if (investorId.startsWith("admin-")) {
      const businessId = investorId.replace("admin-", "");
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { partner: true },
      });
      if (!business) throw new AuthError("Business not found", 404);

      const businessDateFormatted = formatDate(new Date(business.createdAt));
      const totalInvestmentVal = Number(business.totalInvestmentAED) || 0;
      const adminInvestmentVal = Number(business.adminInvestmentAED) || 0;
      const adminShareVal =
        totalInvestmentVal > 0 && adminInvestmentVal > 0
          ? Number(((adminInvestmentVal / totalInvestmentVal) * 100).toFixed(2))
          : 0;

      return {
        id: investorId,
        participantType: "ADMIN",
        name: "Ivora Admin",
        code: `INV-ADM-${business.code}`,
        email: "admin@ivora.trade",
        phone: null,
        emailOrSubtitle: "admin@ivora.trade",
        businessId: business.id,
        business: business.name,
        businessEntity: `${business.code} • ${business.businessType || "Trading"}`,
        entityLabel: `${business.name} (${business.code}) • ADMIN`,
        investmentAED: adminInvestmentVal,
        date: businessDateFormatted,
        sharePercent: adminShareVal,
        allocatedProfitAED: 0,
        paidAED: 0,
        outstandingAED: 0,
        status: "ACTIVE" as InvestorStatus,
        selected: false,
        details: {
          totalInvestmentAED: adminInvestmentVal,
          profitShare: `${adminShareVal}%`,
          profitShareContract: `Admin Treasury Allocation (${adminShareVal}%)`,
          allocatedProfit: 0,
          outstandingBalance: 0,
          paidAmount: 0,
          recentTransactions: [
            {
              id: `CAP-ADM-${business.code}`,
              title: "Admin Initial Capital",
              date: businessDateFormatted,
              reference: `Direct Treasury (${business.code})`,
              amountFormatted: `AED ${adminInvestmentVal.toLocaleString()} Cleared`,
              type: "INWARD REMITTANCE",
            },
          ],
        },
      };
    }

    // 2. Synthetic PARTNER participant
    if (investorId.startsWith("partner-")) {
      const parts = investorId.split("-");
      const businessId = parts[1];
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { partner: true },
      });
      if (!business) throw new AuthError("Business not found", 404);

      const businessDateFormatted = formatDate(new Date(business.createdAt));
      const partnerInvestmentVal = Number(business.partnerInvestmentAED) || 0;
      const partnerEquityVal = Number(business.partnerEquityPct) || 0;
      const partnerName = business.partner?.name || "Partner";

      return {
        id: investorId,
        participantType: "PARTNER",
        name: partnerName,
        code: `INV-PTR-${business.code}`,
        email: business.partner?.email || null,
        phone: business.partner?.phone || null,
        emailOrSubtitle: business.partner?.email ? business.partner.email : "PARTNER • Operating Stake",
        businessId: business.id,
        business: business.name,
        businessEntity: `${business.code} • Partner Equity`,
        entityLabel: `${business.name} (${business.code}) • PARTNER`,
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
              id: `CAP-PTR-${business.code}`,
              title: "Partner Capital Contribution",
              date: businessDateFormatted,
              reference: `Partner Escrow (${business.code})`,
              amountFormatted: `AED ${partnerInvestmentVal.toLocaleString()} Cleared`,
              type: "INWARD REMITTANCE",
            },
          ],
        },
      };
    }

    // 3. External INVESTOR
    const investor = await prisma.investor.findUnique({
      where: { id: investorId },
      include: {
        business: {
          include: {
            partner: true,
          },
        },
        investments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!investor || !investor.business) {
      throw new AuthError("Investor record not found", 404);
    }

    const b = investor.business;
    const totalCommitted = investor.investments.reduce(
      (acc, inv) => acc + (Number(inv.committedAmount) || 0),
      0
    );

    const firstInv = investor.investments[0];
    const invDateFormatted = firstInv
      ? formatDate(new Date(firstInv.depositDate || firstInv.createdAt))
      : formatDate(new Date(investor.createdAt));

    const totalBizInv = Number(b.totalInvestmentAED) || 0;
    const calculatedShare =
      totalBizInv > 0
        ? Number(((totalCommitted / totalBizInv) * 100).toFixed(2))
        : Number(investor.defaultSharePct) || 0;

    const recentTx = investor.investments.map((inv) => ({
      id: `CAP-${investor.code}-${inv.id.slice(-4)}`,
      title: "External Investment Capital",
      date: formatDate(new Date(inv.depositDate || inv.createdAt)),
      reference: `Escrow Account (${b.code})`,
      amountFormatted: `AED ${(Number(inv.committedAmount) || 0).toLocaleString()} Cleared`,
      type: "INWARD REMITTANCE",
    }));

    return {
      id: investor.id,
      participantType: "INVESTOR",
      name: investor.name,
      code: investor.code,
      email: investor.email || null,
      phone: investor.phone || null,
      emailOrSubtitle: `${investor.code} • ${investor.email || "investor@ivora-trade.ae"}`,
      businessId: b.id,
      business: b.name,
      businessEntity: `${b.code} • External Capital`,
      entityLabel: `${b.name} (${b.code}) • ${investor.code}`,
      investmentAED: totalCommitted,
      date: invDateFormatted,
      sharePercent: calculatedShare,
      allocatedProfitAED: 0,
      paidAED: 0,
      outstandingAED: 0,
      status: (investor.status || "ACTIVE") as InvestorStatus,
      selected: false,
      details: {
        totalInvestmentAED: totalCommitted,
        profitShare: `${calculatedShare}%`,
        profitShareContract: `Standard Contract (${calculatedShare}%)`,
        allocatedProfit: 0,
        outstandingBalance: 0,
        paidAmount: 0,
        recentTransactions: recentTx.length > 0 ? recentTx : [
          {
            id: `CAP-${investor.code}`,
            title: "External Investment Capital",
            date: invDateFormatted,
            reference: `Escrow Account (${b.code})`,
            amountFormatted: `AED ${totalCommitted.toLocaleString()} Cleared`,
            type: "INWARD REMITTANCE",
          },
        ],
      },
    };
  });
}

/**
 * Register a new external Investor and record their investment against an existing Business.
 * Transactional capacity validation guarantees that total commitments cannot exceed totalInvestmentAED.
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

  // Parse and validate investment capital
  const rawCapital = investmentCapitalAED ?? investmentAmount ?? committedAmount;
  const capitalNum = Number(rawCapital);
  if (rawCapital === undefined || rawCapital === null || isNaN(capitalNum) || capitalNum <= 0) {
    throw new AuthError("Please provide a valid investment capital amount greater than 0.", 400);
  }

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

  // Transactional Capacity Validation and Creation
  const result = await prisma.$transaction(async (tx) => {
    // 1. Load business with active external investments inside transaction
    const business = await tx.business.findUnique({
      where: { id: businessId.trim() },
      include: {
        investments: {
          where: {
            status: "ACTIVE",
            investor: {
              type: InvestorType.INVESTOR,
            },
          },
          select: {
            committedAmount: true,
          },
        },
      },
    });

    if (!business) {
      throw new AuthError("Selected business does not exist.", 404);
    }

    const businessTotalInvestment = Number(business.totalInvestmentAED) || 0;
    if (businessTotalInvestment <= 0) {
      throw new AuthError("Assigned business has no valid total investment capital.", 400);
    }

    // 2. Authoritative Capacity Rule:
    // Total Committed = Admin + Partner + SUM(Active External Commitments)
    const adminInv = Number(business.adminInvestmentAED) || 0;
    const partnerInv = Number(business.partnerInvestmentAED) || 0;
    const existingExternalCommitments = business.investments.reduce(
      (acc, inv) => acc + (Number(inv.committedAmount) || 0),
      0
    );

    const totalCommitted = adminInv + partnerInv + existingExternalCommitments;
    const remainingCapacity = Math.max(0, Math.round((businessTotalInvestment - totalCommitted) * 100) / 100);

    if (capitalNum > remainingCapacity) {
      const formattedAmount = capitalNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const formattedCapacity = remainingCapacity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      throw new AuthError(
        `Investment amount (AED ${formattedAmount}) exceeds the remaining investment capacity (AED ${formattedCapacity}) for this business.`,
        400
      );
    }

    // 3. Authoritative server-side equity percentage calculation
    const calculatedEquityPct = Number(((capitalNum / businessTotalInvestment) * 100).toFixed(2));

    // 4. Persist external Investor with type INVESTOR
    const investor = await tx.investor.create({
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

    // 5. Persist Investment record
    const investment = await tx.investment.create({
      data: {
        investorId: investor.id,
        businessId: business.id,
        committedAmount: new Prisma.Decimal(capitalNum),
        profitSharePct: new Prisma.Decimal(calculatedEquityPct),
        depositDate: new Date(),
        status: "ACTIVE",
      },
    });

    return {
      investor,
      investment,
      calculatedEquityPct,
      businessId: business.id,
      businessName: business.name,
    };
  });

  // Log audit events
  await logAuditEvent({
    userId: session.userId,
    action: "INVESTOR_CREATED",
    entity: "Investor",
    entityId: result.investor.id,
    newValues: {
      name: result.investor.name,
      code: result.investor.code,
      type: result.investor.type,
      businessId: result.businessId,
      businessName: result.businessName,
      investmentCapitalAED: capitalNum,
      calculatedEquityPct: result.calculatedEquityPct,
    },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "INVESTMENT_CREATED",
    entity: "Investment",
    entityId: result.investment.id,
    newValues: {
      investorId: result.investor.id,
      businessId: result.businessId,
      committedAmount: capitalNum,
      profitSharePct: result.calculatedEquityPct,
    },
  });

  // Invalidate Redis caches
  await invalidateInvestorCaches(result.businessId, undefined, result.investor.id);

  return {
    investor: result.investor,
    investment: result.investment,
    equityPct: result.calculatedEquityPct,
  };
}

export interface UpdateInvestorInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  defaultSharePct?: number;
  investmentAmount?: number | string;
  committedAmount?: number | string;
  status?: "ACTIVE" | "INACTIVE";
}

/**
 * Update an external Investor's details with capacity validation on investment changes.
 * Restricted to ADMIN role with resource-level authorization.
 */
export async function updateInvestor(session: SessionPayload, investorId: string, input: UpdateInvestorInput) {
  if (session.role !== UserRole.ADMIN) {
    throw new AuthError("Forbidden: Admin privileges required to edit investors", 403);
  }

  if (investorId.startsWith("admin-") || investorId.startsWith("partner-")) {
    throw new AuthError("Core Admin and Partner participants cannot be edited as external investors.", 400);
  }

  await requireResourceAccess("Investor", investorId, "WRITE", session);

  const rawCapital = input.investmentAmount ?? input.committedAmount;
  const hasCapitalUpdate = rawCapital !== undefined && rawCapital !== null && rawCapital !== "";

  const updated = await prisma.$transaction(async (tx) => {
    const existingInvestor = await tx.investor.findUnique({
      where: { id: investorId },
      include: {
        investments: true,
        business: {
          include: {
            investments: {
              where: {
                status: "ACTIVE",
                investor: { type: InvestorType.INVESTOR },
              },
            },
          },
        },
      },
    });

    if (!existingInvestor) {
      throw new AuthError("Investor not found", 404);
    }

    if (existingInvestor.type !== InvestorType.INVESTOR) {
      throw new AuthError("Only external investors can be edited.", 400);
    }

    const business = existingInvestor.business;
    if (!business) {
      throw new AuthError("Associated business entity not found", 400);
    }

    const businessTotalInvestment = Number(business.totalInvestmentAED) || 0;
    const adminInv = Number(business.adminInvestmentAED) || 0;
    const partnerInv = Number(business.partnerInvestmentAED) || 0;

    // Active investments excluding the current investor
    const otherExternalCommitments = business.investments
      .filter((inv) => inv.investorId !== investorId && inv.status === "ACTIVE")
      .reduce((acc, inv) => acc + (Number(inv.committedAmount) || 0), 0);

    const maxAllowedCapacity = Math.max(
      0,
      Math.round((businessTotalInvestment - adminInv - partnerInv - otherExternalCommitments) * 100) / 100
    );

    let calculatedEquityPct: number | undefined;

    // 1. Handle Capital Amount Update
    if (hasCapitalUpdate) {
      const newCapitalNum = Number(rawCapital);
      if (isNaN(newCapitalNum) || newCapitalNum <= 0) {
        throw new AuthError("Please provide a valid investment amount greater than 0.", 400);
      }

      if (newCapitalNum > maxAllowedCapacity) {
        const formattedAmount = newCapitalNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedMax = maxAllowedCapacity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedTotal = businessTotalInvestment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        throw new AuthError(
          `Updated investment amount (AED ${formattedAmount}) exceeds the available investment capacity (AED ${formattedMax} available out of AED ${formattedTotal} total capacity) for this business.`,
          400
        );
      }

      calculatedEquityPct = businessTotalInvestment > 0
        ? Number(((newCapitalNum / businessTotalInvestment) * 100).toFixed(2))
        : 0;

      // Update primary investment record or create if not present
      const primaryInvestment = existingInvestor.investments[0];
      if (primaryInvestment) {
        await tx.investment.update({
          where: { id: primaryInvestment.id },
          data: {
            committedAmount: new Prisma.Decimal(newCapitalNum),
            profitSharePct: new Prisma.Decimal(calculatedEquityPct),
            ...(input.status ? { status: input.status } : {}),
          },
        });
      }
    } else if (input.status) {
      // 2. Handle Status Change (e.g. Inactive -> Active or Active -> Inactive)
      if (input.status === "ACTIVE" && existingInvestor.status === "INACTIVE") {
        // Re-activating an investor: ensure their current commitment fits within remaining capacity
        const currentActiveInvestment = existingInvestor.investments.find((inv) => inv.status === "ACTIVE") || existingInvestor.investments[0];
        const neededCapital = currentActiveInvestment ? Number(currentActiveInvestment.committedAmount) : 0;
        if (neededCapital > maxAllowedCapacity) {
          const formattedNeeded = neededCapital.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const formattedMax = maxAllowedCapacity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          throw new AuthError(
            `Cannot activate investor: commitment of AED ${formattedNeeded} exceeds available capacity of AED ${formattedMax}.`,
            400
          );
        }
      }

      // Synchronize Investment status with Investor status
      await tx.investment.updateMany({
        where: { investorId: existingInvestor.id },
        data: { status: input.status },
      });
    }

    const nextSharePct =
      calculatedEquityPct !== undefined
        ? new Prisma.Decimal(calculatedEquityPct)
        : input.defaultSharePct !== undefined
        ? new Prisma.Decimal(input.defaultSharePct)
        : undefined;

    return tx.investor.update({
      where: { id: investorId },
      data: {
        name: input.name !== undefined ? input.name.trim() : undefined,
        email: input.email !== undefined ? (input.email ? input.email.trim() : null) : undefined,
        phone: input.phone !== undefined ? (input.phone ? input.phone.trim() : null) : undefined,
        defaultSharePct: nextSharePct,
        status: input.status,
      },
      include: { business: { select: { id: true, name: true, code: true, partnerId: true } } },
    });
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
    await invalidateInvestorCaches(updated.businessId, updated.business?.partnerId, updated.id);
  }

  return updated;
}

export interface DeleteInvestorResult {
  success: boolean;
  action: "DELETED" | "DEACTIVATED";
  message: string;
  investorId: string;
  investorName: string;
  businessId: string;
  releasedCapacityAED: number;
}

/**
 * Delete or safely deactivate an external Investor.
 * - If 0 transactions: permanently deletes Investment records and Investor entity (releasing capacity).
 * - If transactions exist: blocks permanent hard-deletion to protect the accounting ledger; marks Investor and Investment as INACTIVE.
 * - Restricted to ADMIN role only.
 */
export async function deleteInvestor(
  session: SessionPayload,
  investorId: string,
  options?: { forceDeactivate?: boolean }
): Promise<DeleteInvestorResult> {
  if (session.role !== UserRole.ADMIN) {
    throw new AuthError("Forbidden: Admin privileges required to delete investors", 403);
  }

  if (investorId.startsWith("admin-") || investorId.startsWith("partner-")) {
    throw new AuthError("Core Admin and Partner participants cannot be deleted.", 400);
  }

  await requireResourceAccess("Investor", investorId, "DELETE", session);

  const result = await prisma.$transaction(async (tx) => {
    const existingInvestor = await tx.investor.findUnique({
      where: { id: investorId },
      include: {
        business: { select: { id: true, name: true, code: true, partnerId: true } },
        investments: true,
        transactions: true,
      },
    });

    if (!existingInvestor) {
      throw new AuthError("Investor not found", 404);
    }

    if (existingInvestor.type !== InvestorType.INVESTOR) {
      throw new AuthError("Only external investor entities can be deleted or deactivated.", 400);
    }

    const businessId = existingInvestor.businessId || existingInvestor.business?.id;
    if (!businessId) {
      throw new AuthError("Associated business not found", 400);
    }

    const hasTransactions = existingInvestor.transactions.length > 0;
    const activeInvestments = existingInvestor.investments.filter((inv) => inv.status === "ACTIVE");
    const releasedCapacity = activeInvestments.reduce(
      (acc, inv) => acc + (Number(inv.committedAmount) || 0),
      0
    );

    // Case C & D: If transactions exist, permanent hard delete is strictly blocked
    if (hasTransactions) {
      if (!options?.forceDeactivate) {
        throw new AuthError(
          `This investor has ${existingInvestor.transactions.length} recorded financial ledger entries. Permanent deletion is blocked to preserve accounting history. Please deactivate the investor instead.`,
          400
        );
      }

      // Soft Deactivate: Mark Investor and all its Investments as INACTIVE
      await tx.investment.updateMany({
        where: { investorId: existingInvestor.id, status: "ACTIVE" },
        data: { status: "INACTIVE" },
      });

      await tx.investor.update({
        where: { id: existingInvestor.id },
        data: { status: "INACTIVE" },
      });

      return {
        action: "DEACTIVATED" as const,
        investorId: existingInvestor.id,
        investorName: existingInvestor.name,
        businessId,
        partnerId: existingInvestor.business?.partnerId,
        releasedCapacityAED: releasedCapacity,
        message: `Investor ${existingInvestor.name} has financial ledger history and was deactivated (status set to INACTIVE). Capacity of AED ${releasedCapacity.toLocaleString()} was released.`,
      };
    }

    // Case A & B: Zero transactions. Hard delete allowed.
    if (existingInvestor.investments.length > 0) {
      await tx.investment.deleteMany({
        where: { investorId: existingInvestor.id },
      });
    }

    await tx.investor.delete({
      where: { id: existingInvestor.id },
    });

    return {
      action: "DELETED" as const,
      investorId: existingInvestor.id,
      investorName: existingInvestor.name,
      businessId,
      partnerId: existingInvestor.business?.partnerId,
      releasedCapacityAED: releasedCapacity,
      message: `Investor ${existingInvestor.name} and related investment allocations were permanently deleted. Capacity of AED ${releasedCapacity.toLocaleString()} was released.`,
    };
  });

  // Audit Log
  await logAuditEvent({
    userId: session.userId,
    action: result.action === "DELETED" ? "INVESTOR_DELETED" : "INVESTOR_DEACTIVATED",
    entity: "Investor",
    entityId: result.investorId,
    oldValues: {
      name: result.investorName,
      businessId: result.businessId,
      releasedCapacityAED: result.releasedCapacityAED,
    },
  });

  // Invalidate Redis Caches
  await invalidateInvestorCaches(result.businessId, result.partnerId, result.investorId);

  return {
    success: true,
    action: result.action,
    message: result.message,
    investorId: result.investorId,
    investorName: result.investorName,
    businessId: result.businessId,
    releasedCapacityAED: result.releasedCapacityAED,
  };
}


