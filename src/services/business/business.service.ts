import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { AuthError } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, UserRole, BusinessStatus } from "@prisma/client";

export interface CreateBusinessInput {
  name: string;
  code?: string;
  businessType: string;
  description?: string | null;
  partnerId: string;
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

/**
 * List Businesses within the caller's authorization scope.
 * ADMIN: all businesses. PARTNER: only businesses assigned to caller.
 */
export async function listBusinesses(session: SessionPayload) {
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
        select: { totalLandedCost: true },
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

  return rawBusinesses.map((b) => {
    const totalExternalInvestments = b.investments.reduce(
      (acc, inv) => acc + Number(inv.committedAmount),
      0
    );
    const purchaseCost = b.purchases.reduce(
      (acc, p) => acc + Number(p.totalLandedCost),
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
      salesIndiaAED: sales,
      expensesAED: expenses,
      netProfitAED: netProfit,
      marginPercentage: Number(margin.toFixed(2)),
      status: b.status,
      createdAt: formattedDate,
      productType: b.businessType || "Gold Bullion",
      locationRoute: "Dubai (DXB) → Mumbai (BOM)",
    };
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
      tradingCycles: {
        select: {
          id: true,
          cycleCode: true,
          status: true,
          startDate: true,
          completionDate: true,
          grossRealizationAed: true,
          purchaseLandedCostAed: true,
          directExpensesAed: true,
          grossArbitrageSpreadAed: true,
          netProfitAed: true,
          investorShareTotalAed: true,
          deskRetainedProfitAed: true,
        },
        orderBy: { startDate: "desc" },
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
          refNo: true,
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

  const totalExternalInvestments = business.investments.reduce(
    (acc, inv) => acc + Number(inv.committedAmount),
    0
  );
  const purchaseCost = business.purchases.reduce(
    (acc, p) => acc + Number(p.totalLandedCost),
    0
  );
  const sales = business.sales.reduce(
    (acc, s) => acc + Number(s.aedEquivalent),
    0
  );
  const expenses = business.expenses.reduce(
    (acc, e) => acc + Number(e.amount),
    0
  );
  const netProfit = sales - purchaseCost - expenses;
  const margin = sales > 0 ? (netProfit / sales) * 100 : 0;

  const partnerEquity = Number(business.partnerEquityPct) || 0;
  const adminEquity = Math.max(0, 100 - partnerEquity);
  const totalInvestmentAED = Number(business.totalInvestmentAED) || 0;
  const effectiveInvestmentAED =
    totalInvestmentAED > 0 ? totalInvestmentAED : totalExternalInvestments;
  const adminInvestmentAED = Number(business.adminInvestmentAED) || 0;
  const partnerInvestmentAED = Number(business.partnerInvestmentAED) || 0;

  const nonAdminPartnerName = business.partner?.name?.trim() || "";
  const displayPartnerName = nonAdminPartnerName || "No partner";

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(business.createdAt));

  return {
    ...business,
    totalInvestmentAED: effectiveInvestmentAED,
    adminInvestmentAED,
    partnerInvestmentAED,
    partnerEquityPct: partnerEquity,
    adminEquityPct: adminEquity,
    partnerName: displayPartnerName,
    partnersSummary: displayPartnerName,
    investmentAED: effectiveInvestmentAED,
    purchaseCostAED: purchaseCost,
    salesIndiaAED: sales,
    expensesAED: expenses,
    netProfitAED: netProfit,
    marginPercentage: Number(margin.toFixed(2)),
    createdAtFormatted: formattedDate,
    subtitle: business.description || `${business.name} • ${business.code}`,
  };
}

/**
 * Create a new Business (ADMIN ONLY).
 */
export async function createBusiness(session: SessionPayload, input: CreateBusinessInput) {
  if (session.role !== UserRole.ADMIN) {
    throw new AuthError("Only system administrators can create business entities.", 403);
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

  if (!partnerId || !partnerId.trim()) {
    throw new AuthError("Please select a partner for this business.", 400);
  }

  // Verify that partnerId belongs to an existing User with role PARTNER
  const partnerUser = await prisma.user.findUnique({
    where: { id: partnerId.trim() },
  });

  if (!partnerUser || partnerUser.role !== UserRole.PARTNER) {
    throw new AuthError("A business can only be assigned to a valid Partner user account.", 400);
  }

  const adminInvNum =
    adminInvestment !== undefined &&
    adminInvestment !== null &&
    adminInvestment !== ""
      ? Number(adminInvestment)
      : 0;

  const partnerInvNum =
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
  let calculatedEquity: number;
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
      partnerId: partnerUser.id,
      partnerEquityPct: new Prisma.Decimal(calculatedEquity),
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
 * Update Business configuration / Partner assignment (ADMIN ONLY).
 */
export async function updateBusiness(
  session: SessionPayload,
  businessId: string,
  input: UpdateBusinessInput
) {
  if (session.role !== UserRole.ADMIN) {
    throw new AuthError("Only system administrators can configure business assignments.", 403);
  }

  const existing = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!existing) {
    throw new AuthError("Business not found", 404);
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

  return updated;
}
