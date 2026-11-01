import { PaymentMethod, WalletEntryType, WithdrawalStatus } from "@prisma/client";

export interface BusinessSettlementSummaryItem {
  businessId: string;
  businessCode: string;
  businessName: string;
  businessStatus: string;
  closureDate: string | null;
  committedCapital: number;
  finalEligibleCapitalReturn: number;
  realizedProfitEntitlement: number;
  totalEntitlement: number;
  previouslyPaidDirect: number;
  creditedToWallet: number;
  totalDisbursedOrCredited: number;
  remainingOutstandingEntitlement: number;
  settlementState: "PENDING" | "PARTIALLY_SETTLED" | "SETTLED";
  isClosed: boolean;
}

export interface WalletKPIs {
  /** Spendable funds actually credited to the investor's managed wallet */
  availableBalance: number;
  /** Money from officially closed/settled businesses awaiting allocation/disbursal */
  eligibleUncreditedEntitlement: number;
  /** Alias for backward compatibility */
  pendingUncreditedEntitlement: number;
  /** Funds held in escrow for pending withdrawal approvals */
  reservedBalance: number;
  /** Actual payouts made directly to the investor (bank wire, cash, cheque) */
  totalDirectlyPaid: number;
  /** Historical wallet funds allocated/reinvested into other businesses */
  totalReinvested: number;
  /** Principal capital returned into the wallet */
  totalCapitalReturnedToWallet: number;
  /** Realized profit credited into the wallet */
  totalProfitCreditedToWallet: number;
  /** Total external funds withdrawn by investor */
  totalWithdrawn: number;
  /** Initial direct external deposits */
  totalInitialDeposits: number;
  /** Number of pending withdrawal requests */
  pendingWithdrawalsCount: number;
  /** Unfinalized entitlement from ongoing active businesses (excluded from eligible uncredited) */
  totalActiveBusinessEntitlement: number;
  /** Total remaining unpaid balance from closed businesses */
  totalOutstandingOwedByClosedBusinesses: number;
  /** Legacy alias */
  totalCapitalReturned: number;
  /** Legacy alias */
  totalProfitCredited: number;
}

export type WalletEntryCategory =
  | "WALLET_LEDGER"
  | "DIRECT_PAYMENT"
  | "INTERNAL_TRANSFER"
  | "FRESH_CAPITAL";

export type ExtendedWalletEntryType =
  | WalletEntryType
  | "DIRECT_CAPITAL_RETURN"
  | "DIRECT_PROFIT_DISBURSAL"
  | "REINVESTMENT_SOURCE_TRANSFER"
  | "REINVESTMENT_ALLOCATION"
  | "ADDITIONAL_CAPITAL";

export interface WalletEntryDTO {
  id: string;
  entryCode: string;
  type: ExtendedWalletEntryType;
  category: WalletEntryCategory;
  direction: "CREDIT" | "DEBIT" | "PAYOUT";
  amount: number;
  balanceAfter: number | null;
  description: string;
  reference: string | null;
  paymentMethod: PaymentMethod | null;
  businessId: string | null;
  businessName?: string | null;
  investmentId: string | null;
  sourceTxId: string | null;
  withdrawalId: string | null;
  recordedBy?: string | null;
  createdAt: string;
}

export interface WithdrawalDTO {
  id: string;
  withdrawalCode: string;
  walletId: string;
  investorId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  bankReference: string | null;
  notes: string | null;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt: string | null;
}

export interface InvestorWalletSummary {
  wallet: {
    id: string;
    investorId: string;
    currency: string;
    availableBalance: number;
    reservedBalance: number;
    createdAt: string;
    updatedAt: string;
  };
  investor: {
    id: string;
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
    status: string;
    type?: string;
  };
  kpis: WalletKPIs;
  recentEntries: WalletEntryDTO[];
  pendingWithdrawals: WithdrawalDTO[];
  businessSettlements: BusinessSettlementSummaryItem[];
}
