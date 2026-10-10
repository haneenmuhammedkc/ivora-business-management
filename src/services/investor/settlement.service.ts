import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess } from "@/lib/auth/authorization";
import { AuthError } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, TransactionType, PaymentMethod, UserRole } from "@prisma/client";
import { getFullProfitLossData } from "@/services/financials/financials.service";
import { invalidateInvestorCaches, invalidateBusinessFinancials } from "@/lib/redis/invalidation";

export interface DisbursalPaymentGroup {
  id: string;
  date: string;
  dateRaw: string;
  paymentReference: string;
  capitalReturned: number;
  profitDisbursed: number;
  totalPayment: number;
  paymentMethod: string;
  bankReference: string | null;
  escrowAccount: string | null;
  status: string;
  transactions: Array<{
    id: string;
    transactionCode: string;
    amount: number;
    type: TransactionType;
  }>;
}

export interface InvestorSettlementOverview {
  investor: {
    id: string;
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
    participantType: "ADMIN" | "PARTNER" | "INVESTOR";
  };
  business: {
    id: string;
    name: string;
    code: string;
    businessType: string;
    totalInvestmentAED: number;
    adminInvestmentAED: number;
    partnerInvestmentAED: number;
    partnerEquityPct: number;
  };
  netProfitAED: number;
  contractualSharePct: number;
  defaultAllocatedProfitAED: number;
  persistedAllocatedProfitAED: number | null;
  allocatedProfitAED: number;
  totalInvestmentAED: number;
  totalCapitalPaidAED: number;
  totalProfitPaidAED: number;
  totalPaidAED: number;
  outstandingCapitalAED: number;
  outstandingProfitAED: number;
  totalDueAED: number;
  totalOutstandingAED: number;
  isAllocationLocked: boolean;
  isFullySettled: boolean;
  paymentHistory: DisbursalPaymentGroup[];
}

export interface UpdateAllocationInput {
  businessId: string;
  investorId: string;
  allocatedProfitAmount: number;
}

export interface RecordDisbursalPaymentInput {
  businessId: string;
  investorId: string;
  capitalAmount: number;
  profitAmount: number;
  paymentMethod: PaymentMethod;
  bankReference?: string | null;
  escrowAccount?: string | null;
  transactionDate?: string | Date;
  notes?: string;
}

/**
 * Format date for UI display.
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Generate collision-free unique transaction code for settlement ledger rows.
 */
export function generateDisbursalTransactionCode(
  type: "CAP" | "PRF",
  investorCode: string
): string {
  const cleanCode = investorCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TX-DISB-${type}-${cleanCode}-${timestamp}-${randomSuffix}`;
}

/**
 * Authoritatively retrieves the complete investor settlement overview.
 */
export async function getInvestorSettlementOverview(
  session: SessionPayload,
  businessId: string,
  investorId: string
): Promise<InvestorSettlementOverview> {
  await requireBusinessAccess(businessId, session);

  // 1. Fetch authoritative business
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      partner: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  });

  if (!business) {
    throw new AuthError("Business not found", 404);
  }

  // 2. Fetch authoritative business Net Profit from existing P&L engine
  const pnlData = await getFullProfitLossData(session, { businessId });
  const rawNetProfit = pnlData.kpis?.netProfitAED ?? pnlData.statement?.netProfitAED ?? 0;
  const netProfitAED = Math.max(0, Number(rawNetProfit));

  // 3. Resolve participant / investor details
  let participantName = "";
  let participantCode = "";
  let participantEmail: string | null = null;
  let participantPhone: string | null = null;
  let participantType: "ADMIN" | "PARTNER" | "INVESTOR" = "INVESTOR";
  let committedAmount = 0;
  let contractualSharePct = 0;
  let persistedAllocatedProfitAED: number | null = null;

  if (investorId.startsWith("admin-") || investorId === `INV-ADM-${business.code}`) {
    participantType = "ADMIN";
    participantName = "Ivora Admin";
    participantCode = `INV-ADM-${business.code}`;
    participantEmail = "admin@ivora.trade";
    committedAmount = Number(business.adminInvestmentAED) || 0;
    const totalBizInv = Number(business.totalInvestmentAED) || 0;
    contractualSharePct =
      totalBizInv > 0 && committedAmount > 0
        ? Number(((committedAmount / totalBizInv) * 100).toFixed(2))
        : 0;
  } else if (
    investorId.startsWith("partner-") ||
    investorId === `INV-PTR-${business.code}` ||
    investorId === business.partnerId
  ) {
    participantType = "PARTNER";
    participantName = business.partner?.name || "Partner";
    participantCode = `INV-PTR-${business.code}`;
    participantEmail = business.partner?.email || null;
    participantPhone = business.partner?.phone || null;
    committedAmount = Number(business.partnerInvestmentAED) || 0;
    contractualSharePct = Number(business.partnerEquityPct) || 0;
  } else {
    // External Investor
    await requireResourceAccess("Investor", investorId, "READ", session);
    const investor = await prisma.investor.findUnique({
      where: { id: investorId },
      include: {
        investments: {
          where: { businessId },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!investor) {
      throw new AuthError("Investor not found", 404);
    }

    participantType = "INVESTOR";
    participantName = investor.name;
    participantCode = investor.code;
    participantEmail = investor.email || null;
    participantPhone = investor.phone || null;

    const primaryInvestment = investor.investments[0];
    if (primaryInvestment) {
      committedAmount = Number(primaryInvestment.committedAmount) || 0;
      contractualSharePct = Number(primaryInvestment.profitSharePct) || 0;
      if (primaryInvestment.allocatedProfitAmount !== null && primaryInvestment.allocatedProfitAmount !== undefined) {
        persistedAllocatedProfitAED = Number(primaryInvestment.allocatedProfitAmount);
      }
    } else {
      committedAmount = 0;
      contractualSharePct = Number(investor.defaultSharePct) || 0;
    }
  }

  // 4. Calculate default vs persisted profit allocation
  const defaultAllocatedProfitAED =
    netProfitAED > 0 && contractualSharePct > 0
      ? Number(((netProfitAED * contractualSharePct) / 100).toFixed(2))
      : 0;

  const allocatedProfitAED =
    persistedAllocatedProfitAED !== null ? persistedAllocatedProfitAED : defaultAllocatedProfitAED;

  // 5. Query all historical settlement transactions for this investor and business
  const transactions = await prisma.transaction.findMany({
    where: {
      businessId,
      ...(participantType === "INVESTOR"
        ? { investorId }
        : {
            // For synthetic Admin/Partner participants, match by investorId if recorded or null
            investorId: investorId,
          }),
      type: {
        in: [TransactionType.CAPITAL_RETURN, TransactionType.PROFIT_DISBURSAL],
      },
    },
    orderBy: { transactionDate: "desc" },
  });

  // 6. Aggregate paid totals with Decimal safety
  let totalCapitalPaidDecimal = new Prisma.Decimal(0);
  let totalProfitPaidDecimal = new Prisma.Decimal(0);

  for (const tx of transactions) {
    if (tx.type === TransactionType.CAPITAL_RETURN) {
      totalCapitalPaidDecimal = totalCapitalPaidDecimal.plus(tx.amount);
    } else if (tx.type === TransactionType.PROFIT_DISBURSAL) {
      totalProfitPaidDecimal = totalProfitPaidDecimal.plus(tx.amount);
    }
  }

  const totalCapitalPaidAED = Number(totalCapitalPaidDecimal.toFixed(2));
  const totalProfitPaidAED = Number(totalProfitPaidDecimal.toFixed(2));
  const totalPaidAED = Number(totalCapitalPaidDecimal.plus(totalProfitPaidDecimal).toFixed(2));

  // 7. Calculate outstanding balances
  const totalInvestmentAED = Number(new Prisma.Decimal(committedAmount).toFixed(2));
  const outstandingCapitalAED = Math.max(
    0,
    Number(new Prisma.Decimal(totalInvestmentAED).minus(totalCapitalPaidDecimal).toFixed(2))
  );
  const outstandingProfitAED = Math.max(
    0,
    Number(new Prisma.Decimal(allocatedProfitAED).minus(totalProfitPaidDecimal).toFixed(2))
  );
  const totalDueAED = Number(
    new Prisma.Decimal(totalInvestmentAED).plus(new Prisma.Decimal(allocatedProfitAED)).toFixed(2)
  );
  const totalOutstandingAED = Number(
    new Prisma.Decimal(outstandingCapitalAED).plus(new Prisma.Decimal(outstandingProfitAED)).toFixed(2)
  );

  const isAllocationLocked = totalPaidAED > 0;
  const isFullySettled = totalOutstandingAED <= 0.005 && totalPaidAED > 0;

  // 8. Build grouped payment history
  // Group pairs of CAPITAL_RETURN and PROFIT_DISBURSAL created together
  const groupedMap = new Map<string, DisbursalPaymentGroup>();

  for (const tx of transactions) {
    const txDateStr = formatDate(new Date(tx.transactionDate));
    const txTimeKey = new Date(tx.transactionDate).toISOString().slice(0, 16); // Minute granularity
    const refKey = tx.bankReference?.trim() ? `ref:${tx.bankReference.trim()}` : `time:${txTimeKey}`;
    const groupKey = `${tx.paymentMethod}_${refKey}`;

    const amt = Number(tx.amount);
    const existing = groupedMap.get(groupKey);

    if (!existing) {
      groupedMap.set(groupKey, {
        id: tx.id,
        date: txDateStr,
        dateRaw: tx.transactionDate.toISOString(),
        paymentReference: tx.bankReference || tx.transactionCode,
        capitalReturned: tx.type === TransactionType.CAPITAL_RETURN ? amt : 0,
        profitDisbursed: tx.type === TransactionType.PROFIT_DISBURSAL ? amt : 0,
        totalPayment: amt,
        paymentMethod: tx.paymentMethod.replace(/_/g, " "),
        bankReference: tx.bankReference,
        escrowAccount: tx.escrowAccount,
        status: "CLEARED",
        transactions: [
          {
            id: tx.id,
            transactionCode: tx.transactionCode,
            amount: amt,
            type: tx.type,
          },
        ],
      });
    } else {
      if (tx.type === TransactionType.CAPITAL_RETURN) {
        existing.capitalReturned = Number((existing.capitalReturned + amt).toFixed(2));
      } else if (tx.type === TransactionType.PROFIT_DISBURSAL) {
        existing.profitDisbursed = Number((existing.profitDisbursed + amt).toFixed(2));
      }
      existing.totalPayment = Number((existing.totalPayment + amt).toFixed(2));
      existing.transactions.push({
        id: tx.id,
        transactionCode: tx.transactionCode,
        amount: amt,
        type: tx.type,
      });
    }
  }

  const paymentHistory = Array.from(groupedMap.values()).sort(
    (a, b) => new Date(b.dateRaw).getTime() - new Date(a.dateRaw).getTime()
  );

  return {
    investor: {
      id: investorId,
      name: participantName,
      code: participantCode,
      email: participantEmail,
      phone: participantPhone,
      participantType,
    },
    business: {
      id: business.id,
      name: business.name,
      code: business.code,
      businessType: business.businessType || "Trading",
      totalInvestmentAED: Number(business.totalInvestmentAED) || 0,
      adminInvestmentAED: Number(business.adminInvestmentAED) || 0,
      partnerInvestmentAED: Number(business.partnerInvestmentAED) || 0,
      partnerEquityPct: Number(business.partnerEquityPct) || 0,
    },
    netProfitAED,
    contractualSharePct,
    defaultAllocatedProfitAED,
    persistedAllocatedProfitAED,
    allocatedProfitAED,
    totalInvestmentAED,
    totalCapitalPaidAED,
    totalProfitPaidAED,
    totalPaidAED,
    outstandingCapitalAED,
    outstandingProfitAED,
    totalDueAED,
    totalOutstandingAED,
    isAllocationLocked,
    isFullySettled,
    paymentHistory,
  };
}

/**
 * Admin updates the AED profit allocation for an Investor before settlement payouts begin.
 */
export async function updateInvestorProfitAllocation(
  session: SessionPayload,
  input: UpdateAllocationInput
): Promise<{ success: boolean; allocatedProfitAmount: number; message: string }> {
  if (session.role !== UserRole.ADMIN) {
    throw new AuthError("Only Admins are authorized to set or modify investor profit allocations.", 403);
  }

  const { businessId, investorId, allocatedProfitAmount } = input;
  await requireBusinessAccess(businessId, session);

  if (typeof allocatedProfitAmount !== "number" || isNaN(allocatedProfitAmount) || allocatedProfitAmount < 0) {
    throw new AuthError("Allocated profit amount must be a valid non-negative number.", 400);
  }

  const allocDecimal = new Prisma.Decimal(allocatedProfitAmount.toFixed(2));

  // 1. Fetch business and check P&L net profit
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      investments: {
        include: { investor: true },
      },
    },
  });

  if (!business) {
    throw new AuthError("Business not found", 404);
  }

  const pnlData = await getFullProfitLossData(session, { businessId });
  const rawNetProfit = pnlData.kpis?.netProfitAED ?? pnlData.statement?.netProfitAED ?? 0;
  const netProfitAED = Math.max(0, Number(rawNetProfit));
  const netProfitDecimal = new Prisma.Decimal(netProfitAED.toFixed(2));

  if (allocDecimal.gt(netProfitDecimal)) {
    throw new AuthError(
      `Allocated profit (AED ${allocDecimal.toFixed(2)}) cannot exceed total business Net Profit (AED ${netProfitDecimal.toFixed(2)}).`,
      400
    );
  }

  // 2. Locate the specific investment record
  const targetInvestment = await prisma.investment.findFirst({
    where: { investorId, businessId },
  });

  if (!targetInvestment) {
    throw new AuthError("No investment contract found for this investor in the selected business.", 404);
  }

  // 3. Phase 6 Allocation Lock Check: Has any payment been executed?
  const existingPayments = await prisma.transaction.count({
    where: {
      businessId,
      investorId,
      type: {
        in: [TransactionType.CAPITAL_RETURN, TransactionType.PROFIT_DISBURSAL],
      },
    },
  });

  if (existingPayments > 0) {
    throw new AuthError(
      "Profit allocation is locked and cannot be modified because disbursal payments have already commenced for this investor.",
      400
    );
  }

  // 4. Global Reconciliation Check: Sum of all allocations <= Net Profit
  let otherAllocationsSum = new Prisma.Decimal(0);
  for (const inv of business.investments) {
    if (inv.id === targetInvestment.id) continue;
    if (inv.allocatedProfitAmount !== null && inv.allocatedProfitAmount !== undefined) {
      otherAllocationsSum = otherAllocationsSum.plus(inv.allocatedProfitAmount);
    } else {
      // Default formula for other investors
      const share = Number(inv.profitSharePct) || 0;
      const calc = (netProfitAED * share) / 100;
      otherAllocationsSum = otherAllocationsSum.plus(new Prisma.Decimal(calc.toFixed(2)));
    }
  }

  // Also include partner equity profit if applicable
  const partnerShare = Number(business.partnerEquityPct) || 0;
  const partnerAlloc = (netProfitAED * partnerShare) / 100;
  otherAllocationsSum = otherAllocationsSum.plus(new Prisma.Decimal(partnerAlloc.toFixed(2)));

  const totalAllocatedSum = otherAllocationsSum.plus(allocDecimal);
  if (totalAllocatedSum.gt(netProfitDecimal.plus(new Prisma.Decimal("0.05")))) {
    throw new AuthError(
      `Total profit allocations across all participants (AED ${totalAllocatedSum.toFixed(2)}) would exceed total business Net Profit (AED ${netProfitDecimal.toFixed(2)}).`,
      400
    );
  }

  // 5. Persist to PostgreSQL
  const updatedInvestment = await prisma.investment.update({
    where: { id: targetInvestment.id },
    data: {
      allocatedProfitAmount: allocDecimal,
    },
  });

  // 6. Audit log
  await logAuditEvent({
    userId: session.userId,
    action: "INVESTOR_PROFIT_ALLOCATED",
    entity: "Investment",
    entityId: updatedInvestment.id,
    newValues: {
      businessId,
      investorId,
      allocatedProfitAmount: Number(allocDecimal),
    },
  });

  // 7. Invalidate caches
  try {
    await invalidateInvestorCaches(businessId, business.partnerId, investorId);
    await invalidateBusinessFinancials(businessId, business.partnerId);
  } catch (err) {
    console.error("Cache invalidation failed (non-fatal):", err);
  }

  return {
    success: true,
    allocatedProfitAmount: Number(allocDecimal),
    message: `Profit allocation of AED ${allocDecimal.toFixed(2)} persisted successfully.`,
  };
}

/**
 * Executes an atomic settlement disbursal payment with split Capital Return and Profit Disbursal ledger entries.
 */
export async function recordDisbursalPayment(
  session: SessionPayload,
  input: RecordDisbursalPaymentInput
): Promise<{
  success: boolean;
  message: string;
  transactions: Array<{ id: string; transactionCode: string; amount: number; type: TransactionType }>;
  isFullySettled: boolean;
}> {
  if (session.role !== UserRole.ADMIN) {
    throw new AuthError("Only Admins are authorized to record settlement disbursals.", 403);
  }

  const {
    businessId,
    investorId,
    capitalAmount,
    profitAmount,
    paymentMethod,
    bankReference,
    escrowAccount,
    transactionDate,
    notes,
  } = input;

  await requireBusinessAccess(businessId, session);

  const capNum = Number(capitalAmount) || 0;
  const prfNum = Number(profitAmount) || 0;

  if (capNum < 0 || prfNum < 0) {
    throw new AuthError("Payment amounts cannot be negative.", 400);
  }

  const totalPaymentNum = capNum + prfNum;
  if (totalPaymentNum <= 0) {
    throw new AuthError("Total payment amount must be greater than zero.", 400);
  }

  const capDecimal = new Prisma.Decimal(capNum.toFixed(2));
  const prfDecimal = new Prisma.Decimal(prfNum.toFixed(2));

  // Determine effective payment date
  let effectiveDate = new Date();
  if (transactionDate) {
    const d = new Date(transactionDate);
    if (!isNaN(d.getTime())) {
      effectiveDate = d;
    }
  }

  // ATOMIC DATABASE TRANSACTION
  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch business
    const business = await tx.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      throw new AuthError("Business not found", 404);
    }

    // 2. Fetch investor & investment
    const investor = await tx.investor.findUnique({
      where: { id: investorId },
      include: {
        investments: {
          where: { businessId },
        },
      },
    });

    if (!investor) {
      throw new AuthError("Investor not found", 404);
    }

    const investment = investor.investments[0];
    if (!investment) {
      throw new AuthError("No investment contract found for this investor in the business.", 404);
    }

    const totalCommittedDecimal = investment.committedAmount;

    const pnlData = await getFullProfitLossData(session, { businessId });
    const rawNetProfit = pnlData.kpis?.netProfitAED ?? pnlData.statement?.netProfitAED ?? 0;
    const netProfitAED = Math.max(0, Number(rawNetProfit));

    let allocatedProfitDecimal: Prisma.Decimal;
    if (investment.allocatedProfitAmount !== null && investment.allocatedProfitAmount !== undefined) {
      allocatedProfitDecimal = investment.allocatedProfitAmount;
    } else {
      const share = Number(investment.profitSharePct) || 0;
      const defaultAlloc = (netProfitAED * share) / 100;
      allocatedProfitDecimal = new Prisma.Decimal(defaultAlloc.toFixed(2));
    }

    // 4. Re-read all existing settlement transactions in the same transaction
    const priorTransactions = await tx.transaction.findMany({
      where: {
        businessId,
        investorId,
        type: {
          in: [TransactionType.CAPITAL_RETURN, TransactionType.PROFIT_DISBURSAL],
        },
      },
      select: {
        amount: true,
        type: true,
      },
    });

    let priorCapitalPaid = new Prisma.Decimal(0);
    let priorProfitPaid = new Prisma.Decimal(0);

    for (const p of priorTransactions) {
      if (p.type === TransactionType.CAPITAL_RETURN) {
        priorCapitalPaid = priorCapitalPaid.plus(p.amount);
      } else if (p.type === TransactionType.PROFIT_DISBURSAL) {
        priorProfitPaid = priorProfitPaid.plus(p.amount);
      }
    }

    const outstandingCapital = Prisma.Decimal.max(new Prisma.Decimal(0), totalCommittedDecimal.minus(priorCapitalPaid));
    const outstandingProfit = Prisma.Decimal.max(new Prisma.Decimal(0), allocatedProfitDecimal.minus(priorProfitPaid));

    // 5. Strict Balance Validation with epsilon tolerance
    const epsilon = new Prisma.Decimal("0.005");

    if (capDecimal.gt(outstandingCapital.plus(epsilon))) {
      throw new AuthError(
        `Requested capital return (AED ${capDecimal.toFixed(2)}) exceeds remaining outstanding capital (AED ${outstandingCapital.toFixed(2)}).`,
        400
      );
    }

    if (prfDecimal.gt(outstandingProfit.plus(epsilon))) {
      throw new AuthError(
        `Requested profit disbursal (AED ${prfDecimal.toFixed(2)}) exceeds remaining outstanding profit (AED ${outstandingProfit.toFixed(2)}).`,
        400
      );
    }

    // 6. Create atomic transaction records
    const createdTransactions: Array<{ id: string; transactionCode: string; amount: number; type: TransactionType }> = [];

    // Common reference for grouping
    const cleanRef = bankReference?.trim() || `DISB-${investor.code}-${Date.now().toString(36).toUpperCase()}`;

    // A. Principal Capital Return ledger row
    if (capDecimal.gt(0)) {
      const capCode = generateDisbursalTransactionCode("CAP", investor.code);
      const capTx = await tx.transaction.create({
        data: {
          transactionCode: capCode,
          businessId,
          investorId,
          amount: capDecimal,
          type: TransactionType.CAPITAL_RETURN,
          paymentMethod,
          bankReference: cleanRef,
          escrowAccount: escrowAccount?.trim() || null,
          transactionDate: effectiveDate,
        },
      });
      createdTransactions.push({
        id: capTx.id,
        transactionCode: capTx.transactionCode,
        amount: Number(capDecimal),
        type: TransactionType.CAPITAL_RETURN,
      });
    }

    // B. Profit Disbursal ledger row
    if (prfDecimal.gt(0)) {
      const prfCode = generateDisbursalTransactionCode("PRF", investor.code);
      const prfTx = await tx.transaction.create({
        data: {
          transactionCode: prfCode,
          businessId,
          investorId,
          amount: prfDecimal,
          type: TransactionType.PROFIT_DISBURSAL,
          paymentMethod,
          bankReference: cleanRef,
          escrowAccount: escrowAccount?.trim() || null,
          transactionDate: effectiveDate,
        },
      });
      createdTransactions.push({
        id: prfTx.id,
        transactionCode: prfTx.transactionCode,
        amount: Number(prfDecimal),
        type: TransactionType.PROFIT_DISBURSAL,
      });
    }

    // 7. Check if newly updated total outstanding is <= 0
    const newRemainingCapital = outstandingCapital.minus(capDecimal);
    const newRemainingProfit = outstandingProfit.minus(prfDecimal);
    const newTotalOutstanding = newRemainingCapital.plus(newRemainingProfit);

    const isFullySettled = newTotalOutstanding.lte(new Prisma.Decimal("0.005"));

    if (isFullySettled) {
      await tx.investment.update({
        where: { id: investment.id },
        data: { status: "SETTLED" },
      });
    }

    return {
      createdTransactions,
      isFullySettled,
      partnerId: business.partnerId,
    };
  });

  // 8. Audit Log
  await logAuditEvent({
    userId: session.userId,
    action: "INVESTOR_DISBURSAL_RECORDED",
    entity: "Investor",
    entityId: investorId,
    newValues: {
      businessId,
      capitalAmount: capNum,
      profitAmount: prfNum,
      totalPayment: totalPaymentNum,
      paymentMethod,
      bankReference,
      notes,
      transactions: result.createdTransactions,
      isFullySettled: result.isFullySettled,
    },
  });

  // 9. Cache Invalidation
  try {
    await invalidateInvestorCaches(businessId, result.partnerId, investorId);
    await invalidateBusinessFinancials(businessId, result.partnerId);
  } catch (err) {
    console.error("Cache invalidation error (non-fatal):", err);
  }

  return {
    success: true,
    message: `Successfully recorded disbursal of AED ${(capNum + prfNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
    transactions: result.createdTransactions,
    isFullySettled: result.isFullySettled,
  };
}
