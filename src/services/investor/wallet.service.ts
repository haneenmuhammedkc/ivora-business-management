import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { AuthError } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/audit.service";
import {
  Prisma,
  UserRole,
  InvestorType,
  PaymentMethod,
  WalletEntryType,
  WithdrawalStatus,
  BusinessStatus,
  TransactionType,
} from "@prisma/client";
import { getOrSetCache } from "@/lib/redis/cache";
import { CacheKeys, CacheTTL } from "@/lib/redis/keys";
import { invalidateInvestorCaches, invalidateBusinessFinancials } from "@/lib/redis/invalidation";
import {
  InvestorWalletSummary,
  WalletKPIs,
  WalletEntryDTO,
  ExtendedWalletEntryType,
  WalletEntryCategory,
  WithdrawalDTO,
  BusinessSettlementSummaryItem,
} from "@/types/wallet";
import {
  parseWalletAmount,
  validatePaymentMethod,
  DepositWalletInput,
  AllocateWalletInput,
  RequestWithdrawalInput,
  ProcessWithdrawalInput,
} from "@/validators/wallet.validator";

/**
 * Ensures that only external investor records (not synthetic admin/partner participants)
 * can own personal wallets.
 */
export async function requireExternalInvestor(investorId: string, tx: Prisma.TransactionClient = prisma) {
  if (
    investorId.startsWith("admin-") ||
    investorId.startsWith("partner-") ||
    investorId.startsWith("INV-ADM-") ||
    investorId.startsWith("INV-PTR-")
  ) {
    throw new AuthError("Personal wallets are only provisioned for external investors.", 400);
  }

  const investor = await tx.investor.findUnique({
    where: { id: investorId },
    select: {
      id: true,
      name: true,
      code: true,
      email: true,
      phone: true,
      status: true,
      type: true,
      businessId: true,
    },
  });

  if (!investor) {
    throw new AuthError("Investor record not found.", 404);
  }

  if (investor.type !== InvestorType.INVESTOR) {
    throw new AuthError("Personal wallets are only provisioned for external investors.", 400);
  }

  return investor;
}

/**
 * Idempotently retrieve or provision a personal wallet for an eligible external investor.
 */
export async function getOrCreateInvestorWallet(
  investorId: string,
  tx: Prisma.TransactionClient = prisma
) {
  await requireExternalInvestor(investorId, tx);

  let wallet = await tx.investorWallet.findUnique({
    where: { investorId },
  });

  if (!wallet) {
    wallet = await tx.investorWallet.create({
      data: {
        investorId,
        currency: "AED",
        availableBalance: new Prisma.Decimal(0),
        reservedBalance: new Prisma.Decimal(0),
      },
    });
  }

  return wallet;
}

/**
 * Generate unique, collision-resistant codes for wallet entries.
 */
export function generateWalletEntryCode(prefix: string, investorCode: string): string {
  const cleanCode = investorCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WLT-${prefix}-${cleanCode}-${timestamp}-${rand}`;
}

/**
 * Generate unique withdrawal code.
 */
export function generateWithdrawalCode(investorCode: string): string {
  const cleanCode = investorCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WDR-${cleanCode}-${timestamp}-${rand}`;
}

/**
 * Authoritatively retrieves an investor's personal wallet overview, KPIs, ledger history,
 * and business settlement breakdowns.
 * Accessible to ADMIN and assigned PARTNER.
 */
export async function getInvestorWalletSummary(
  session: SessionPayload,
  investorId: string
): Promise<InvestorWalletSummary> {
  if (session.role !== UserRole.ADMIN && session.role !== UserRole.PARTNER) {
    throw new AuthError("Forbidden: Only Admins and assigned Partners are authorized to view investor wallets.", 403);
  }

  await requireExternalInvestor(investorId);

  if (session.role === UserRole.PARTNER) {
    const partnerInvestment = await prisma.investment.findFirst({
      where: {
        investorId,
        business: { partnerId: session.userId },
      },
    });
    if (!partnerInvestment) {
      throw new AuthError("Forbidden: You are not authorized to view this investor's wallet.", 403);
    }
  }

  const cacheKey =
    session.role === UserRole.PARTNER
      ? `${CacheKeys.investors.wallet(investorId)}:partner:${session.userId}`
      : CacheKeys.investors.wallet(investorId);

  return getOrSetCache(cacheKey, CacheTTL.SHORT, async () => {
    const investor = await requireExternalInvestor(investorId);
    const wallet = await getOrCreateInvestorWallet(investorId);

    // If Partner, determine their assigned business IDs
    let partnerBusinessIds: Set<string> | null = null;
    if (session.role === UserRole.PARTNER) {
      const partnerBusinesses = await prisma.business.findMany({
        where: { partnerId: session.userId },
        select: { id: true },
      });
      partnerBusinessIds = new Set(partnerBusinesses.map((b) => b.id));
    }

    // Fetch entries with business names
    const allEntries = await prisma.investorWalletEntry.findMany({
      where: { walletId: wallet.id },
      include: {
        business: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const entries = partnerBusinessIds
      ? allEntries.filter((e) => !e.businessId || partnerBusinessIds!.has(e.businessId))
      : allEntries;

    // Fetch pending withdrawals
    const pendingWithdrawals = await prisma.investorWithdrawal.findMany({
      where: {
        walletId: wallet.id,
        status: WithdrawalStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate ledger KPIs
    let totalInitialDepositsDec = new Prisma.Decimal(0);
    let totalCapitalReturnedDec = new Prisma.Decimal(0);
    let totalProfitCreditedDec = new Prisma.Decimal(0);
    let totalReinvestedDec = new Prisma.Decimal(0);
    let totalWithdrawnDec = new Prisma.Decimal(0);

    for (const e of entries) {
      if (e.type === WalletEntryType.INITIAL_DEPOSIT) {
        totalInitialDepositsDec = totalInitialDepositsDec.plus(e.amount);
      } else if (e.type === WalletEntryType.CAPITAL_RETURN_CREDIT) {
        totalCapitalReturnedDec = totalCapitalReturnedDec.plus(e.amount);
      } else if (e.type === WalletEntryType.PROFIT_CREDIT) {
        totalProfitCreditedDec = totalProfitCreditedDec.plus(e.amount);
      } else if (e.type === WalletEntryType.INVESTMENT_ALLOCATION) {
        totalReinvestedDec = totalReinvestedDec.plus(e.amount);
      } else if (e.type === WalletEntryType.WITHDRAWAL_DEBIT) {
        totalWithdrawnDec = totalWithdrawnDec.plus(e.amount);
      }
    }

    // Fetch investments for this investor to compute business settlement breakdown
    const investments = await prisma.investment.findMany({
      where: {
        investorId: investor.id,
        ...(partnerBusinessIds ? { businessId: { in: Array.from(partnerBusinessIds) } } : {}),
      },
      include: {
        business: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            updatedAt: true,
            partnerId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const businessIds = investments.map((inv) => inv.businessId);

    // Fetch all settlement transactions and capital inward for these businesses and this investor
    const allTransactions =
      businessIds.length > 0
        ? await prisma.transaction.findMany({
            where: {
              businessId: { in: businessIds },
              investorId: investor.id,
              type: {
                in: [
                  TransactionType.CAPITAL_RETURN,
                  TransactionType.PROFIT_DISBURSAL,
                  TransactionType.CAPITAL_INWARD,
                ],
              },
            },
            include: {
              business: {
                select: { id: true, code: true, name: true },
              },
            },
            orderBy: { createdAt: "desc" },
          })
        : [];

    // 1. Identify transactions that were already linked to wallet entries to avoid double counting
    const walletSourceTxIds = new Set(
      allEntries.map((e) => e.sourceTxId).filter((id): id is string => Boolean(id))
    );

    const directTxsByBiz = new Map<string, Prisma.Decimal>();
    for (const t of allTransactions) {
      if (!t.businessId) continue;
      if (t.type === TransactionType.CAPITAL_INWARD) continue;
      if (walletSourceTxIds.has(t.id)) continue;
      const cur = directTxsByBiz.get(t.businessId) || new Prisma.Decimal(0);
      directTxsByBiz.set(t.businessId, cur.plus(t.amount));
    }

    // 2. Map wallet credits & reinvestment draws by businessId
    const walletCreditsByBiz = new Map<string, Prisma.Decimal>();
    for (const e of allEntries) {
      if (!e.businessId) continue;
      if (
        e.type === WalletEntryType.CAPITAL_RETURN_CREDIT ||
        e.type === WalletEntryType.PROFIT_CREDIT
      ) {
        const cur = walletCreditsByBiz.get(e.businessId) || new Prisma.Decimal(0);
        walletCreditsByBiz.set(e.businessId, cur.plus(e.amount));
      }
    }

    // 3. Dynamically calculate settlement summary per business
    const businessSettlements: BusinessSettlementSummaryItem[] = [];
    let eligibleUncreditedEntitlementDec = new Prisma.Decimal(0);
    let totalActiveBusinessEntitlementDec = new Prisma.Decimal(0);
    let totalOutstandingOwedByClosedBizDec = new Prisma.Decimal(0);
    let totalDirectlyPaidDec = new Prisma.Decimal(0);

    for (const inv of investments) {
      const biz = inv.business;
      const committed = inv.committedAmount;

      let allocatedProfit: Prisma.Decimal;
      if (inv.allocatedProfitAmount !== null && inv.allocatedProfitAmount !== undefined) {
        allocatedProfit = inv.allocatedProfitAmount;
      } else {
        allocatedProfit = new Prisma.Decimal(0);
        try {
          const { getFullProfitLossData } = await import("@/services/financials/financials.service");
          const pnl = await getFullProfitLossData(session, { businessId: biz.id });
          const rawNetProfit = pnl.kpis?.netProfitAED ?? pnl.statement?.netProfitAED ?? 0;
          const netProfit = Math.max(0, Number(rawNetProfit));
          const share = Number(inv.profitSharePct) || 0;
          allocatedProfit = new Prisma.Decimal(((netProfit * share) / 100).toFixed(2));
        } catch {
          allocatedProfit = new Prisma.Decimal(0);
        }
      }

      const totalEntitlementDec = committed.plus(allocatedProfit);

      // Conceptual Formula:
      // Available settlement amount = Final investor entitlement − Valid direct payments − Amounts already credited or reinvested
      const directPaidDec = directTxsByBiz.get(biz.id) || new Prisma.Decimal(0);
      const creditedOrReinvestedDec = walletCreditsByBiz.get(biz.id) || new Prisma.Decimal(0);
      const totalSettledDec = directPaidDec.plus(creditedOrReinvestedDec);

      const remainingOutstandingDec = Prisma.Decimal.max(
        new Prisma.Decimal(0),
        totalEntitlementDec.minus(totalSettledDec)
      );

      const isClosed =
        biz.status === BusinessStatus.SETTLED || biz.status === BusinessStatus.INACTIVE;

      let settlementState: "PENDING" | "PARTIALLY_SETTLED" | "SETTLED" = "PENDING";
      const epsilon = new Prisma.Decimal("0.005");
      if (remainingOutstandingDec.lte(epsilon)) {
        settlementState = "SETTLED";
      } else if (totalSettledDec.gt(epsilon)) {
        settlementState = "PARTIALLY_SETTLED";
      } else {
        settlementState = "PENDING";
      }

      totalDirectlyPaidDec = totalDirectlyPaidDec.plus(directPaidDec);

      if (isClosed) {
        eligibleUncreditedEntitlementDec = eligibleUncreditedEntitlementDec.plus(remainingOutstandingDec);
        totalOutstandingOwedByClosedBizDec = totalOutstandingOwedByClosedBizDec.plus(remainingOutstandingDec);
      } else {
        totalActiveBusinessEntitlementDec = totalActiveBusinessEntitlementDec.plus(remainingOutstandingDec);
      }

      businessSettlements.push({
        businessId: biz.id,
        businessCode: biz.code,
        businessName: biz.name,
        businessStatus: biz.status,
        closureDate: isClosed ? biz.updatedAt.toISOString() : null,
        committedCapital: Number(committed.toFixed(2)),
        finalEligibleCapitalReturn: Number(committed.toFixed(2)),
        realizedProfitEntitlement: Number(allocatedProfit.toFixed(2)),
        totalEntitlement: Number(totalEntitlementDec.toFixed(2)),
        previouslyPaidDirect: Number(directPaidDec.toFixed(2)),
        creditedToWallet: Number(creditedOrReinvestedDec.toFixed(2)),
        totalDisbursedOrCredited: Number(totalSettledDec.toFixed(2)),
        remainingOutstandingEntitlement: Number(remainingOutstandingDec.toFixed(2)),
        settlementState,
        isClosed,
      });
    }

    const kpis: WalletKPIs = {
      availableBalance: Number(wallet.availableBalance),
      reservedBalance: Number(wallet.reservedBalance),
      eligibleUncreditedEntitlement: Number(eligibleUncreditedEntitlementDec.toFixed(2)),
      pendingUncreditedEntitlement: Number(eligibleUncreditedEntitlementDec.toFixed(2)),
      totalDirectlyPaid: Number(totalDirectlyPaidDec.toFixed(2)),
      totalReinvested: Number(totalReinvestedDec.toFixed(2)),
      totalInitialDeposits: Number(totalInitialDepositsDec.toFixed(2)),
      totalCapitalReturnedToWallet: Number(totalCapitalReturnedDec.toFixed(2)),
      totalProfitCreditedToWallet: Number(totalProfitCreditedDec.toFixed(2)),
      totalCapitalReturned: Number(totalCapitalReturnedDec.toFixed(2)),
      totalProfitCredited: Number(totalProfitCreditedDec.toFixed(2)),
      totalWithdrawn: Number(totalWithdrawnDec.toFixed(2)),
      totalOutstandingOwedByClosedBusinesses: Number(totalOutstandingOwedByClosedBizDec.toFixed(2)),
      totalActiveBusinessEntitlement: Number(totalActiveBusinessEntitlementDec.toFixed(2)),
      pendingWithdrawalsCount: pendingWithdrawals.length,
    };

    const directPaymentTransactions = allTransactions.filter(
      (tx) =>
        !walletSourceTxIds.has(tx.id) &&
        (tx.type === TransactionType.CAPITAL_RETURN || tx.type === TransactionType.PROFIT_DISBURSAL)
    );

    const directPaymentDTOs: WalletEntryDTO[] = directPaymentTransactions.map((tx) => ({
      id: tx.id,
      entryCode: tx.transactionCode,
      type: tx.type === TransactionType.CAPITAL_RETURN ? "DIRECT_CAPITAL_RETURN" : "DIRECT_PROFIT_DISBURSAL",
      category: "DIRECT_PAYMENT",
      direction: "PAYOUT",
      amount: Number(tx.amount),
      balanceAfter: null,
      description: `Direct settlement payout (${tx.type === TransactionType.CAPITAL_RETURN ? "Capital Return" : "Profit Disbursal"}) from ${tx.business.code}`,
      reference: tx.bankReference || null,
      paymentMethod: tx.paymentMethod,
      businessId: tx.businessId,
      businessName: `${tx.business.name} (${tx.business.code})`,
      investmentId: null,
      sourceTxId: tx.id,
      withdrawalId: null,
      recordedBy: "Direct Disbursal",
      createdAt: (tx.transactionDate || tx.createdAt).toISOString(),
    }));

    const capitalInwardTransactions = allTransactions.filter(
      (tx) => tx.type === TransactionType.CAPITAL_INWARD
    );

    const capitalInwardDTOs: WalletEntryDTO[] = capitalInwardTransactions.map((tx) => ({
      id: tx.id,
      entryCode: tx.transactionCode,
      type: "ADDITIONAL_CAPITAL",
      category: "FRESH_CAPITAL",
      direction: "CREDIT",
      amount: Number(tx.amount),
      balanceAfter: null,
      description: `Additional Capital Invested into ${tx.business.name} (${tx.business.code}) alongside reinvestment`,
      reference: tx.bankReference || null,
      paymentMethod: tx.paymentMethod,
      businessId: tx.businessId,
      businessName: `${tx.business.name} (${tx.business.code})`,
      investmentId: null,
      sourceTxId: tx.id,
      withdrawalId: null,
      recordedBy: "Fresh Capital Injection",
      createdAt: (tx.transactionDate || tx.createdAt).toISOString(),
    }));

    const walletEntryDTOs: WalletEntryDTO[] = entries.map((e) => {
      let direction: "CREDIT" | "DEBIT" | "PAYOUT" = "CREDIT";
      if (
        e.type === WalletEntryType.INVESTMENT_ALLOCATION ||
        e.type === WalletEntryType.WITHDRAWAL_DEBIT
      ) {
        direction = "DEBIT";
      }

      const isReinvestmentDraw =
        e.type === WalletEntryType.PROFIT_CREDIT &&
        (e.description.toLowerCase().includes("reinvestment") ||
          e.entryCode.includes("REINV") ||
          (e.reference && e.reference.includes("REINV")));

      const isReinvestmentAllocation =
        e.type === WalletEntryType.INVESTMENT_ALLOCATION;

      let type: ExtendedWalletEntryType = e.type;
      let category: WalletEntryCategory = "WALLET_LEDGER";
      let balanceAfter: number | null = Number(e.balanceAfter);

      if (isReinvestmentDraw) {
        type = "REINVESTMENT_SOURCE_TRANSFER";
        category = "INTERNAL_TRANSFER";
        balanceAfter = null; // Suppress intermediate synthetic balance
      } else if (isReinvestmentAllocation) {
        type = "REINVESTMENT_ALLOCATION";
        category = "INTERNAL_TRANSFER";
        balanceAfter = null; // Suppress intermediate synthetic balance
      }

      return {
        id: e.id,
        entryCode: e.entryCode,
        type,
        category,
        direction,
        amount: Number(e.amount),
        balanceAfter,
        description: e.description,
        reference: e.reference,
        paymentMethod: e.paymentMethod,
        businessId: e.businessId,
        businessName: e.business ? `${e.business.name} (${e.business.code})` : null,
        investmentId: e.investmentId,
        sourceTxId: e.sourceTxId,
        withdrawalId: e.withdrawalId,
        recordedBy: "System Admin",
        createdAt: e.createdAt.toISOString(),
      };
    });

    const recentEntries: WalletEntryDTO[] = [
      ...walletEntryDTOs,
      ...directPaymentDTOs,
      ...capitalInwardDTOs,
    ].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const pendingWithdrawalDTOs: WithdrawalDTO[] = pendingWithdrawals.map((w) => ({
      id: w.id,
      withdrawalCode: w.withdrawalCode,
      walletId: w.walletId,
      investorId: w.investorId,
      amount: Number(w.amount),
      paymentMethod: w.paymentMethod,
      bankReference: w.bankReference,
      notes: w.notes,
      status: w.status,
      requestedAt: w.requestedAt.toISOString(),
      processedAt: w.processedAt ? w.processedAt.toISOString() : null,
    }));

    return {
      wallet: {
        id: wallet.id,
        investorId: wallet.investorId,
        currency: wallet.currency,
        availableBalance: Number(wallet.availableBalance),
        reservedBalance: Number(wallet.reservedBalance),
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString(),
      },
      investor: {
        id: investor.id,
        name: investor.name,
        code: investor.code,
        email: investor.email,
        phone: investor.phone,
        status: investor.status,
      },
      kpis,
      recentEntries,
      pendingWithdrawals: pendingWithdrawalDTOs,
      businessSettlements,
    };
  });
}

/**
 * Record an initial deposit into an investor's personal wallet.
 * Increases availableBalance by amount, posts INITIAL_DEPOSIT entry.
 */
export async function recordWalletDeposit(
  session: SessionPayload,
  investorId: string,
  input: DepositWalletInput
) {
  if (session.role !== UserRole.ADMIN) {
    throw new AuthError("Forbidden: Only Admins can record wallet deposits.", 403);
  }

  const { error: amtErr, parsedValue: depositAmount } = parseWalletAmount(input.amount, "Deposit amount");
  if (amtErr || !depositAmount) throw new AuthError(amtErr || "Invalid deposit amount.", 400);

  const { error: methodErr, method: paymentMethod } = validatePaymentMethod(input.paymentMethod);
  if (methodErr || !paymentMethod) throw new AuthError(methodErr || "Invalid payment method.", 400);

  const cleanReference = typeof input.reference === "string" && input.reference.trim() ? input.reference.trim() : null;
  const cleanNotes = typeof input.notes === "string" && input.notes.trim() ? input.notes.trim() : null;
  const idempotencyKey = typeof input.idempotencyKey === "string" && input.idempotencyKey.trim() ? input.idempotencyKey.trim() : null;

  let effectiveDate = new Date();
  if (input.date) {
    const d = new Date(String(input.date));
    if (!isNaN(d.getTime())) effectiveDate = d;
  }

  const amountDecimal = new Prisma.Decimal(depositAmount.toFixed(2));

  const result = await prisma.$transaction(async (tx) => {
    const investor = await requireExternalInvestor(investorId, tx);
    const wallet = await getOrCreateInvestorWallet(investorId, tx);

    const entryCode = idempotencyKey
      ? `WLT-DEP-${investor.code}-${idempotencyKey}`
      : generateWalletEntryCode("DEP", investor.code);

    // Idempotency check
    const existingEntry = await tx.investorWalletEntry.findUnique({
      where: { entryCode },
    });
    if (existingEntry) {
      return {
        wallet,
        entry: existingEntry,
        isDuplicate: true,
      };
    }

    const updatedWallet = await tx.investorWallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { increment: amountDecimal },
      },
    });

    const entry = await tx.investorWalletEntry.create({
      data: {
        walletId: wallet.id,
        entryCode,
        type: WalletEntryType.INITIAL_DEPOSIT,
        amount: amountDecimal,
        balanceAfter: updatedWallet.availableBalance,
        description: cleanNotes || `Initial personal wallet deposit via ${paymentMethod.replace(/_/g, " ")}`,
        reference: cleanReference,
        paymentMethod,
        createdById: session.userId,
        createdAt: effectiveDate,
      },
    });

    return {
      wallet: updatedWallet,
      entry,
      isDuplicate: false,
    };
  });

  // Audit log
  await logAuditEvent({
    userId: session.userId,
    action: "WALLET_DEPOSIT_RECORDED",
    entity: "InvestorWallet",
    entityId: result.wallet.id,
    newValues: {
      investorId,
      amount: depositAmount,
      entryCode: result.entry.entryCode,
      paymentMethod,
      reference: cleanReference,
      availableBalanceAfter: Number(result.wallet.availableBalance),
    },
  });

  // Cache invalidation
  await invalidateInvestorCaches(investorId, undefined, investorId);

  return {
    success: true,
    message: `Deposit of AED ${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} recorded successfully.`,
    entry: result.entry,
    availableBalance: Number(result.wallet.availableBalance),
  };
}

/**
 * Allocate personal wallet funds to a business investment.
 * Validates availableBalance >= amount, validates business remaining capacity,
 * debits availableBalance, creates or increases investment contract without altering profitSharePct unless authorized.
 */
export async function allocateWalletFundsToBusiness(
  session: SessionPayload,
  investorId: string,
  input: AllocateWalletInput
) {
  if (session.role !== UserRole.ADMIN && session.role !== UserRole.PARTNER) {
    throw new AuthError("Forbidden: Only Admins and assigned Partners can allocate wallet funds to businesses.", 403);
  }

  let allocAmount = 0;
  if (input.amount !== undefined && input.amount !== null && String(input.amount).trim() !== "") {
    const { error: amtErr, parsedValue: parsedAlloc } = parseWalletAmount(input.amount, "Reinvestment amount");
    if (amtErr || !parsedAlloc) throw new AuthError(amtErr || "Invalid reinvestment amount.", 400);
    allocAmount = parsedAlloc;
  }

  let additionalAmount = 0;
  let additionalPaymentMethod: PaymentMethod | null = null;
  let cleanAdditionalRef: string | null = null;
  let additionalEffectiveDate = new Date();

  if (
    input.additionalAmount !== undefined &&
    input.additionalAmount !== null &&
    String(input.additionalAmount).trim() !== ""
  ) {
    const { error: addErr, parsedValue: parsedAdd } = parseWalletAmount(
      input.additionalAmount,
      "Additional investment amount"
    );
    if (addErr || !parsedAdd) throw new AuthError(addErr || "Invalid additional investment amount.", 400);
    additionalAmount = parsedAdd;

    const { error: methodErr, method: validMethod } = validatePaymentMethod(input.additionalPaymentMethod);
    if (methodErr || !validMethod) {
      throw new AuthError(
        "A valid payment method is required for additional investment funds (DIRECT_BANK_WIRE, ESCROW_TRANSFER, CASH_VAULT, or CHEQUE).",
        400
      );
    }
    additionalPaymentMethod = validMethod;

    if (typeof input.additionalReference === "string" && input.additionalReference.trim()) {
      cleanAdditionalRef = input.additionalReference.trim();
    }
    if (input.additionalDate) {
      const d = new Date(String(input.additionalDate));
      if (!isNaN(d.getTime())) additionalEffectiveDate = d;
    }
  }

  const totalAllocatedNum = Number((allocAmount + additionalAmount).toFixed(2));
  if (totalAllocatedNum <= 0) {
    throw new AuthError("Total investment allocation amount must be greater than zero.", 400);
  }

  const businessId = typeof input.businessId === "string" ? input.businessId.trim() : "";
  if (!businessId) {
    throw new AuthError("A target business must be selected.", 400);
  }

  const cleanNotes = typeof input.notes === "string" && input.notes.trim() ? input.notes.trim() : null;
  const cleanRef = typeof input.reference === "string" && input.reference.trim() ? input.reference.trim() : null;
  const idempotencyKey = typeof input.idempotencyKey === "string" && input.idempotencyKey.trim() ? input.idempotencyKey.trim() : null;

  const reinvestAmountDecimal = new Prisma.Decimal(allocAmount.toFixed(2));
  const additionalAmountDecimal = new Prisma.Decimal(additionalAmount.toFixed(2));
  const totalAllocatedDecimal = reinvestAmountDecimal.plus(additionalAmountDecimal);

  const result = await prisma.$transaction(async (tx) => {
    const investor = await requireExternalInvestor(investorId, tx);
    const wallet = await getOrCreateInvestorWallet(investor.id, tx);

    const sourceBusinessId =
      typeof input.sourceBusinessId === "string" && input.sourceBusinessId.trim()
        ? input.sourceBusinessId.trim()
        : null;

    // 1. Calculate eligible settlement funds from closed businesses
    const closedInvestments = await tx.investment.findMany({
      where: {
        investorId: investor.id,
        business: {
          status: { in: [BusinessStatus.SETTLED, BusinessStatus.INACTIVE] },
        },
      },
      include: {
        business: {
          select: { id: true, code: true, name: true, status: true, partnerId: true },
        },
      },
    });

    const closedBizIds = closedInvestments.map((inv) => inv.businessId);

    const closedTxs =
      closedBizIds.length > 0
        ? await tx.transaction.findMany({
            where: {
              businessId: { in: closedBizIds },
              investorId: investor.id,
              type: { in: [TransactionType.CAPITAL_RETURN, TransactionType.PROFIT_DISBURSAL] },
            },
            select: { businessId: true, amount: true },
          })
        : [];

    const closedEntries = await tx.investorWalletEntry.findMany({
      where: {
        walletId: wallet.id,
        businessId: { in: closedBizIds },
      },
      select: { businessId: true, type: true, amount: true },
    });

    const txByClosedBiz = new Map<string, Prisma.Decimal>();
    for (const t of closedTxs) {
      if (!t.businessId) continue;
      const cur = txByClosedBiz.get(t.businessId) || new Prisma.Decimal(0);
      txByClosedBiz.set(t.businessId, cur.plus(t.amount));
    }

    const creditsByClosedBiz = new Map<string, Prisma.Decimal>();
    for (const e of closedEntries) {
      if (!e.businessId) continue;
      if (
        e.type === WalletEntryType.CAPITAL_RETURN_CREDIT ||
        e.type === WalletEntryType.PROFIT_CREDIT
      ) {
        const cur = creditsByClosedBiz.get(e.businessId) || new Prisma.Decimal(0);
        creditsByClosedBiz.set(e.businessId, cur.plus(e.amount));
      }
    }

    const eligibleClosedBizList: Array<{
      business: { id: string; code: string; name: string; status: BusinessStatus; partnerId: string | null };
      remainingEligible: Prisma.Decimal;
    }> = [];
    let totalEligibleFromClosed = new Prisma.Decimal(0);

    for (const inv of closedInvestments) {
      const biz = inv.business;
      const committed = inv.committedAmount;
      const allocProfit = inv.allocatedProfitAmount || new Prisma.Decimal(0);
      const totalEntitlement = committed.plus(allocProfit);

      const paidDirect = txByClosedBiz.get(biz.id) || new Prisma.Decimal(0);
      const credited = creditsByClosedBiz.get(biz.id) || new Prisma.Decimal(0);
      const totalSettled = paidDirect.plus(credited);
      const remainingEligible = Prisma.Decimal.max(new Prisma.Decimal(0), totalEntitlement.minus(totalSettled));

      if (remainingEligible.gt(new Prisma.Decimal("0.005"))) {
        eligibleClosedBizList.push({ business: biz, remainingEligible });
        totalEligibleFromClosed = totalEligibleFromClosed.plus(remainingEligible);
      }
    }

    const totalSpendable = wallet.availableBalance.plus(totalEligibleFromClosed);

    if (reinvestAmountDecimal.gt(0) && totalSpendable.lt(reinvestAmountDecimal)) {
      throw new AuthError(
        `Insufficient eligible settlement funds for reinvestment (Available: AED ${Number(totalSpendable).toLocaleString(undefined, { minimumFractionDigits: 2 })}, Requested: AED ${allocAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`,
        400
      );
    }

    // Resolve source closed business if reinvesting
    let resolvedSourceBiz: { id: string; code: string; name: string; status: BusinessStatus; partnerId: string | null } | null = null;
    let drawFromClosedBiz = new Prisma.Decimal(0);

    if (reinvestAmountDecimal.gt(0)) {
      if (wallet.availableBalance.gte(reinvestAmountDecimal)) {
        // Funded entirely by existing wallet balance
        drawFromClosedBiz = new Prisma.Decimal(0);
      } else {
        drawFromClosedBiz = reinvestAmountDecimal.minus(wallet.availableBalance);

        if (sourceBusinessId) {
          const match = eligibleClosedBizList.find((b) => b.business.id === sourceBusinessId);
          if (!match || match.remainingEligible.lt(drawFromClosedBiz)) {
            throw new AuthError(
              `Selected source business does not have sufficient remaining eligible settlement funds (Available: AED ${Number(match?.remainingEligible ?? 0).toFixed(2)}).`,
              400
            );
          }
          resolvedSourceBiz = match.business;
        } else {
          // Automatically pick the closed business with sufficient remaining entitlement
          const match =
            eligibleClosedBizList.find((b) => b.remainingEligible.gte(drawFromClosedBiz)) ||
            eligibleClosedBizList[0];
          if (!match) {
            throw new AuthError("No closed business with eligible settlement entitlement found.", 400);
          }
          resolvedSourceBiz = match.business;
        }
      }
    }

    // 2. Validate target business existence and active status
    const targetBusiness = await tx.business.findUnique({
      where: { id: businessId },
      include: {
        investments: {
          where: {
            status: "ACTIVE",
            investor: { type: InvestorType.INVESTOR },
          },
          select: { committedAmount: true, investorId: true, id: true, profitSharePct: true },
        },
      },
    });

    if (!targetBusiness) {
      throw new AuthError("Target business not found.", 404);
    }

    if (targetBusiness.status !== BusinessStatus.ACTIVE) {
      throw new AuthError("Reinvestments can only be allocated into active trading businesses.", 400);
    }

    if (resolvedSourceBiz && resolvedSourceBiz.id === targetBusiness.id) {
      throw new AuthError("Cannot allocate reinvestment funds back into the source business.", 400);
    }

    if (session.role === UserRole.PARTNER) {
      if (targetBusiness.partnerId !== session.userId) {
        throw new AuthError("Forbidden: Partners can only allocate funds to their assigned business.", 403);
      }
      if (resolvedSourceBiz && resolvedSourceBiz.partnerId && resolvedSourceBiz.partnerId !== session.userId) {
        throw new AuthError("Forbidden: You can only reinvest funds originating from your assigned business.", 403);
      }
    }

    const businessTotalInv = Number(targetBusiness.totalInvestmentAED) || 0;
    if (businessTotalInv <= 0) {
      throw new AuthError("Target business has no valid total investment capital.", 400);
    }

    // 3. Check remaining target business capacity
    const adminInv = Number(targetBusiness.adminInvestmentAED) || 0;
    const partnerInv = Number(targetBusiness.partnerInvestmentAED) || 0;
    const existingExternalSum = targetBusiness.investments.reduce(
      (sum, inv) => sum + (Number(inv.committedAmount) || 0),
      0
    );
    const totalCommitted = adminInv + partnerInv + existingExternalSum;
    const remainingCapacity = Math.max(0, Math.round((businessTotalInv - totalCommitted) * 100) / 100);

    if (totalAllocatedNum > remainingCapacity + 0.005) {
      throw new AuthError(
        `Total investment allocation (AED ${totalAllocatedNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds remaining business capacity (AED ${remainingCapacity.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`,
        400
      );
    }

    // 4. Update or Create Investment Contract in Target Business
    const existingInvestment = targetBusiness.investments.find((inv) => inv.investorId === investor.id);

    let targetInvestmentId = "";
    let finalCommittedAmount: Prisma.Decimal;
    let finalSharePct: Prisma.Decimal;

    if (existingInvestment) {
      // Rule A: Increase existing investment committedAmount, PRESERVING contractual profitSharePct terms
      targetInvestmentId = existingInvestment.id;
      finalCommittedAmount = existingInvestment.committedAmount.plus(totalAllocatedDecimal);
      finalSharePct = existingInvestment.profitSharePct;

      await tx.investment.update({
        where: { id: existingInvestment.id },
        data: {
          committedAmount: finalCommittedAmount,
        },
      });
    } else {
      // Rule B: Create new investment contract in target business
      const defaultEquity = Number(((totalAllocatedNum / businessTotalInv) * 100).toFixed(2));
      finalSharePct = new Prisma.Decimal(defaultEquity);
      finalCommittedAmount = totalAllocatedDecimal;

      const newInvestment = await tx.investment.create({
        data: {
          investorId: investor.id,
          businessId: targetBusiness.id,
          committedAmount: totalAllocatedDecimal,
          profitSharePct: finalSharePct,
          depositDate: new Date(),
          status: "ACTIVE",
        },
      });
      targetInvestmentId = newInvestment.id;
    }

    // 5. If Additional Fresh Capital is provided, record real Capital Inward Transaction
    let additionalTx = null;
    if (additionalAmountDecimal.gt(0) && additionalPaymentMethod) {
      const addTxCode = `TX-CAP-ADD-${targetBusiness.code}-${investor.code}-${Date.now().toString(36).toUpperCase()}`;
      additionalTx = await tx.transaction.create({
        data: {
          transactionCode: addTxCode,
          businessId: targetBusiness.id,
          investorId: investor.id,
          amount: additionalAmountDecimal,
          type: TransactionType.CAPITAL_INWARD,
          paymentMethod: additionalPaymentMethod,
          bankReference: cleanAdditionalRef,
          transactionDate: additionalEffectiveDate,
        },
      });
    }

    // 6. Ledger movements for Reinvested Funds
    let updatedWallet = wallet;
    let reinvestEntry = null;

    if (reinvestAmountDecimal.gt(0)) {
      const sourceRef = resolvedSourceBiz ? `REINV-${resolvedSourceBiz.code}-${targetBusiness.code}` : `INV-${targetBusiness.code}`;

      // If funded from closed business, record the source settlement credit entry
      if (drawFromClosedBiz.gt(0) && resolvedSourceBiz) {
        await tx.investorWalletEntry.create({
          data: {
            walletId: wallet.id,
            entryCode: `WLT-STL-REINV-${resolvedSourceBiz.code}-${Date.now().toString(36).toUpperCase()}`,
            type: WalletEntryType.PROFIT_CREDIT,
            amount: drawFromClosedBiz,
            balanceAfter: wallet.availableBalance.plus(drawFromClosedBiz),
            description: `Settlement entitlement drawn for reinvestment into ${targetBusiness.name} (${targetBusiness.code})`,
            reference: cleanRef || sourceRef,
            paymentMethod: PaymentMethod.ESCROW_TRANSFER,
            businessId: resolvedSourceBiz.id,
            createdById: session.userId,
          },
        });

        // Increase available balance by drawn amount so the debit brings it back to net balance
        await tx.investorWallet.update({
          where: { id: wallet.id },
          data: { availableBalance: { increment: drawFromClosedBiz } },
        });
      }

      // Debit the allocation amount
      updatedWallet = await tx.investorWallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { decrement: reinvestAmountDecimal },
        },
      });

      if (updatedWallet.availableBalance.lt(0)) {
        throw new AuthError("Concurrent transaction error: Available balance cannot be negative.", 400);
      }

      const entryCode = idempotencyKey
        ? `WLT-ALC-${investor.code}-${idempotencyKey}`
        : generateWalletEntryCode("ALC", investor.code);

      const desc = resolvedSourceBiz
        ? cleanNotes || `Reinvestment from ${resolvedSourceBiz.code} into ${targetBusiness.name} (${targetBusiness.code})`
        : cleanNotes || `Wallet fund allocation to ${targetBusiness.name} (${targetBusiness.code})`;

      reinvestEntry = await tx.investorWalletEntry.create({
        data: {
          walletId: wallet.id,
          entryCode,
          type: WalletEntryType.INVESTMENT_ALLOCATION,
          amount: reinvestAmountDecimal,
          balanceAfter: updatedWallet.availableBalance,
          description: desc,
          reference: cleanRef || sourceRef,
          paymentMethod: PaymentMethod.ESCROW_TRANSFER,
          businessId: targetBusiness.id,
          investmentId: targetInvestmentId,
          createdById: session.userId,
        },
      });
    }

    return {
      wallet: updatedWallet,
      reinvestEntry,
      additionalTx,
      targetBusiness,
      sourceBusiness: resolvedSourceBiz,
      investmentId: targetInvestmentId,
      finalCommittedAmount: Number(finalCommittedAmount),
    };
  });

  // Audit Log
  await logAuditEvent({
    userId: session.userId,
    action: "INVESTOR_REINVESTMENT_ALLOCATED",
    entity: "Investment",
    entityId: result.investmentId,
    newValues: {
      investorId,
      targetBusinessId: result.targetBusiness.id,
      targetBusinessCode: result.targetBusiness.code,
      sourceBusinessId: result.sourceBusiness?.id || null,
      sourceBusinessCode: result.sourceBusiness?.code || null,
      reinvestedAmount: allocAmount,
      additionalAmount,
      totalAllocatedAmount: totalAllocatedNum,
      additionalPaymentMethod,
      additionalReference: cleanAdditionalRef,
      entryCode: result.reinvestEntry?.entryCode || null,
      additionalTxCode: result.additionalTx?.transactionCode || null,
      committedAmountAfter: result.finalCommittedAmount,
    },
  });

  // Invalidate Caches for both businesses and investor
  await invalidateInvestorCaches(businessId, result.targetBusiness.partnerId, investorId);
  await invalidateBusinessFinancials(businessId, result.targetBusiness.partnerId);
  if (result.sourceBusiness) {
    await invalidateInvestorCaches(result.sourceBusiness.id, result.sourceBusiness.partnerId, investorId);
    await invalidateBusinessFinancials(result.sourceBusiness.id, result.sourceBusiness.partnerId);
  }

  const msgParts: string[] = [];
  if (allocAmount > 0) {
    msgParts.push(
      `AED ${allocAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} reinvested from ${result.sourceBusiness ? `${result.sourceBusiness.name} (${result.sourceBusiness.code})` : "settlement balance"}`
    );
  }
  if (additionalAmount > 0) {
    msgParts.push(
      `AED ${additionalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} additional capital via ${additionalPaymentMethod?.replace(/_/g, " ")}`
    );
  }

  return {
    success: true,
    message: `Successfully allocated AED ${totalAllocatedNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to ${result.targetBusiness.name} (${result.targetBusiness.code}) (${msgParts.join(" + ")}).`,
    entry: result.reinvestEntry,
    additionalTransaction: result.additionalTx,
    reinvestedAmount: allocAmount,
    additionalAmount,
    totalAllocatedAmount: totalAllocatedNum,
    availableBalance: Number(result.wallet.availableBalance),
    investmentId: result.investmentId,
    totalCommittedAmount: result.finalCommittedAmount,
  };
}

/**
 * Initiates an Admin-controlled withdrawal.
 * Moves funds from availableBalance to reservedBalance and creates InvestorWithdrawal in PENDING status.
 * Ledger is NOT debited with WITHDRAWAL_DEBIT until completion.
 */
export async function requestWithdrawal(
  session: SessionPayload,
  investorId: string,
  input: RequestWithdrawalInput
) {
  if (session.role !== UserRole.ADMIN) {
    throw new AuthError("Forbidden: Only Admins can initiate withdrawals.", 403);
  }

  const { error: amtErr, parsedValue: withdrawAmount } = parseWalletAmount(input.amount, "Withdrawal amount");
  if (amtErr || !withdrawAmount) throw new AuthError(amtErr || "Invalid withdrawal amount.", 400);

  const { error: methodErr, method: paymentMethod } = validatePaymentMethod(input.paymentMethod);
  if (methodErr || !paymentMethod) throw new AuthError(methodErr || "Invalid payment method.", 400);

  const cleanRef = typeof input.bankReference === "string" && input.bankReference.trim() ? input.bankReference.trim() : null;
  const cleanNotes = typeof input.notes === "string" && input.notes.trim() ? input.notes.trim() : null;
  const idempotencyKey = typeof input.idempotencyKey === "string" && input.idempotencyKey.trim() ? input.idempotencyKey.trim() : null;

  const amountDecimal = new Prisma.Decimal(withdrawAmount.toFixed(2));

  const result = await prisma.$transaction(async (tx) => {
    const investor = await requireExternalInvestor(investorId, tx);
    const wallet = await getOrCreateInvestorWallet(investorId, tx);

    if (wallet.availableBalance.lt(amountDecimal)) {
      throw new AuthError(
        `Insufficient available wallet balance (Available: AED ${Number(wallet.availableBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}, Requested: AED ${withdrawAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`,
        400
      );
    }

    // Move available to reserved
    const updatedWallet = await tx.investorWallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { decrement: amountDecimal },
        reservedBalance: { increment: amountDecimal },
      },
    });

    if (updatedWallet.availableBalance.lt(0)) {
      throw new AuthError("Concurrent transaction error: Available balance cannot be negative.", 400);
    }

    const withdrawalCode = idempotencyKey
      ? `WDR-${investor.code}-${idempotencyKey}`
      : generateWithdrawalCode(investor.code);

    const withdrawal = await tx.investorWithdrawal.create({
      data: {
        withdrawalCode,
        walletId: wallet.id,
        investorId: investor.id,
        amount: amountDecimal,
        paymentMethod,
        bankReference: cleanRef,
        notes: cleanNotes,
        status: WithdrawalStatus.PENDING,
        requestedById: session.userId,
      },
    });

    return {
      wallet: updatedWallet,
      withdrawal,
    };
  });

  // Audit Log
  await logAuditEvent({
    userId: session.userId,
    action: "WITHDRAWAL_REQUESTED",
    entity: "InvestorWithdrawal",
    entityId: result.withdrawal.id,
    newValues: {
      investorId,
      amount: withdrawAmount,
      withdrawalCode: result.withdrawal.withdrawalCode,
      status: WithdrawalStatus.PENDING,
    },
  });

  await invalidateInvestorCaches(investorId, undefined, investorId);

  return {
    success: true,
    message: `Withdrawal request for AED ${withdrawAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} initiated. Funds reserved.`,
    withdrawal: result.withdrawal,
    availableBalance: Number(result.wallet.availableBalance),
    reservedBalance: Number(result.wallet.reservedBalance),
  };
}

/**
 * Completes a pending withdrawal.
 * Decrements reservedBalance, posts WITHDRAWAL_DEBIT entry to ledger, marks status COMPLETED.
 */
export async function completeWithdrawal(
  session: SessionPayload,
  withdrawalId: string,
  input?: ProcessWithdrawalInput
) {
  if (session.role !== UserRole.ADMIN) {
    throw new AuthError("Forbidden: Only Admins can complete withdrawals.", 403);
  }

  const result = await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.investorWithdrawal.findUnique({
      where: { id: withdrawalId },
      include: { wallet: { include: { investor: true } } },
    });

    if (!withdrawal) throw new AuthError("Withdrawal record not found.", 404);
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new AuthError(`Cannot complete withdrawal in ${withdrawal.status} status. Only PENDING withdrawals can be completed.`, 400);
    }

    const amountDecimal = withdrawal.amount;
    const wallet = withdrawal.wallet;

    if (wallet.reservedBalance.lt(amountDecimal)) {
      throw new AuthError("Financial inconsistency: Reserved balance is less than withdrawal amount.", 400);
    }

    // Release reservation
    const updatedWallet = await tx.investorWallet.update({
      where: { id: wallet.id },
      data: {
        reservedBalance: { decrement: amountDecimal },
      },
    });

    // Mark withdrawal COMPLETED
    const updatedWithdrawal = await tx.investorWithdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: WithdrawalStatus.COMPLETED,
        processedById: session.userId,
        processedAt: new Date(),
        notes: input?.notes ? `${withdrawal.notes || ""}\nCompletion Notes: ${input.notes}`.trim() : withdrawal.notes,
      },
    });

    // Post immutable WITHDRAWAL_DEBIT entry to ledger
    const entryCode = `WLT-WDR-CMP-${withdrawal.withdrawalCode}`;
    const entry = await tx.investorWalletEntry.create({
      data: {
        walletId: wallet.id,
        entryCode,
        type: WalletEntryType.WITHDRAWAL_DEBIT,
        amount: amountDecimal,
        balanceAfter: updatedWallet.availableBalance, // Balance remains what was available post-reservation
        description: `Completed withdrawal of AED ${Number(amountDecimal).toLocaleString(undefined, { minimumFractionDigits: 2 })} via ${withdrawal.paymentMethod.replace(/_/g, " ")}`,
        reference: withdrawal.bankReference || withdrawal.withdrawalCode,
        paymentMethod: withdrawal.paymentMethod,
        withdrawalId: withdrawal.id,
        createdById: session.userId,
      },
    });

    return {
      wallet: updatedWallet,
      withdrawal: updatedWithdrawal,
      entry,
    };
  });

  // Audit Log
  await logAuditEvent({
    userId: session.userId,
    action: "WITHDRAWAL_COMPLETED",
    entity: "InvestorWithdrawal",
    entityId: result.withdrawal.id,
    newValues: {
      withdrawalCode: result.withdrawal.withdrawalCode,
      amount: Number(result.withdrawal.amount),
      status: WithdrawalStatus.COMPLETED,
    },
  });

  await invalidateInvestorCaches(result.withdrawal.investorId, undefined, result.withdrawal.investorId);

  return {
    success: true,
    message: `Withdrawal ${result.withdrawal.withdrawalCode} successfully completed and disbursed.`,
    withdrawal: result.withdrawal,
    entry: result.entry,
  };
}

/**
 * Cancels or rejects a pending withdrawal.
 * Releases reservedBalance, restores availableBalance, posts WITHDRAWAL_REVERSAL to ledger with audit explanation.
 */
export async function cancelWithdrawal(
  session: SessionPayload,
  withdrawalId: string,
  action: "CANCELLED" | "REJECTED",
  input?: ProcessWithdrawalInput
) {
  if (session.role !== UserRole.ADMIN) {
    throw new AuthError("Forbidden: Only Admins can cancel or reject withdrawals.", 403);
  }

  const newStatus = action === "CANCELLED" ? WithdrawalStatus.CANCELLED : WithdrawalStatus.REJECTED;

  const result = await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.investorWithdrawal.findUnique({
      where: { id: withdrawalId },
      include: { wallet: { include: { investor: true } } },
    });

    if (!withdrawal) throw new AuthError("Withdrawal record not found.", 404);
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new AuthError(`Cannot ${action.toLowerCase()} withdrawal in ${withdrawal.status} status. Only PENDING withdrawals can be modified.`, 400);
    }

    const amountDecimal = withdrawal.amount;
    const wallet = withdrawal.wallet;

    if (wallet.reservedBalance.lt(amountDecimal)) {
      throw new AuthError("Financial inconsistency: Reserved balance is less than withdrawal amount.", 400);
    }

    // Release reservation back to available
    const updatedWallet = await tx.investorWallet.update({
      where: { id: wallet.id },
      data: {
        reservedBalance: { decrement: amountDecimal },
        availableBalance: { increment: amountDecimal },
      },
    });

    // Mark withdrawal status
    const updatedWithdrawal = await tx.investorWithdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: newStatus,
        processedById: session.userId,
        processedAt: new Date(),
        notes: input?.notes ? `${withdrawal.notes || ""}\n${action} Notes: ${input.notes}`.trim() : withdrawal.notes,
      },
    });

    // Post immutable WITHDRAWAL_REVERSAL entry to ledger
    const entryCode = `WLT-WDR-REV-${withdrawal.withdrawalCode}-${action.substring(0, 3)}`;
    const entry = await tx.investorWalletEntry.create({
      data: {
        walletId: wallet.id,
        entryCode,
        type: WalletEntryType.WITHDRAWAL_REVERSAL,
        amount: amountDecimal,
        balanceAfter: updatedWallet.availableBalance,
        description: `Reversal of ${action.toLowerCase()} withdrawal ${withdrawal.withdrawalCode}. Reserved funds restored to available balance.`,
        reference: withdrawal.bankReference || withdrawal.withdrawalCode,
        paymentMethod: withdrawal.paymentMethod,
        withdrawalId: withdrawal.id,
        createdById: session.userId,
      },
    });

    return {
      wallet: updatedWallet,
      withdrawal: updatedWithdrawal,
      entry,
    };
  });

  // Audit Log
  await logAuditEvent({
    userId: session.userId,
    action: `WITHDRAWAL_${action}`,
    entity: "InvestorWithdrawal",
    entityId: result.withdrawal.id,
    newValues: {
      withdrawalCode: result.withdrawal.withdrawalCode,
      amount: Number(result.withdrawal.amount),
      status: newStatus,
      availableBalanceRestored: Number(result.wallet.availableBalance),
    },
  });

  await invalidateInvestorCaches(result.withdrawal.investorId, undefined, result.withdrawal.investorId);

  return {
    success: true,
    message: `Withdrawal ${result.withdrawal.withdrawalCode} has been ${action.toLowerCase()}. Reserved funds restored to available balance.`,
    withdrawal: result.withdrawal,
    entry: result.entry,
  };
}

/**
 * Reconciles an investor's personal wallet ledger against persisted balances.
 * Guarantees availableBalance === sum(Credits) - sum(Debits) - reservedBalance.
 * Does NOT silently rewrite ledger history.
 */
export async function reconcileInvestorWallet(
  investorId: string,
  tx: Prisma.TransactionClient = prisma
) {
  const investor = await requireExternalInvestor(investorId, tx);
  const wallet = await tx.investorWallet.findUnique({
    where: { investorId: investor.id },
    include: {
      entries: true,
      withdrawals: { where: { status: WithdrawalStatus.PENDING } },
    },
  });

  if (!wallet) return { isBalanced: true, discrepancyAED: 0 };

  let totalCredits = new Prisma.Decimal(0);
  let totalDebits = new Prisma.Decimal(0);

  for (const e of wallet.entries) {
    if (
      e.type === WalletEntryType.INITIAL_DEPOSIT ||
      e.type === WalletEntryType.CAPITAL_RETURN_CREDIT ||
      e.type === WalletEntryType.PROFIT_CREDIT ||
      e.type === WalletEntryType.WITHDRAWAL_REVERSAL
    ) {
      totalCredits = totalCredits.plus(e.amount);
    } else if (
      e.type === WalletEntryType.INVESTMENT_ALLOCATION ||
      e.type === WalletEntryType.WITHDRAWAL_DEBIT
    ) {
      totalDebits = totalDebits.plus(e.amount);
    }
  }

  const expectedReserved = wallet.withdrawals.reduce(
    (sum, w) => sum.plus(w.amount),
    new Prisma.Decimal(0)
  );

  const expectedAvailable = totalCredits.minus(totalDebits).minus(expectedReserved);
  const discrepancy = wallet.availableBalance.minus(expectedAvailable);

  const isBalanced = discrepancy.abs().lte(new Prisma.Decimal("0.005"));

  return {
    isBalanced,
    persistedAvailable: Number(wallet.availableBalance),
    expectedAvailable: Number(expectedAvailable),
    persistedReserved: Number(wallet.reservedBalance),
    expectedReserved: Number(expectedReserved),
    discrepancyAED: Number(discrepancy),
  };
}
