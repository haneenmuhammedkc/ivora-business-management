export type InvestorStatus = "ACTIVE" | "PENDING" | "CLEARED";

export interface AuditTransaction {
  id: string;
  title: string;
  date: string;
  reference: string;
  amountFormatted: string;
  type: string;
}

export interface InvestorRecord {
  id: string;
  name: string;
  isMultiEntity?: boolean;
  emailOrSubtitle: string;
  business: string;
  businessEntity: string;
  entityLabel: string;
  investmentAED: number;
  date: string;
  sharePercent: number;
  allocatedProfitAED: number;
  paidAED: number;
  outstandingAED: number;
  status: InvestorStatus;
  selected?: boolean;
  details: {
    totalInvestmentAED: number;
    profitShare: string;
    profitShareContract: string;
    allocatedProfit: number;
    outstandingBalance: number;
    paidAmount: number;
    cycleAllocation: {
      cycleId: string;
      netCycleProfitAED: number;
      contractedRatio: string;
      investorProfitCreditAED: number;
      allocationDate: string;
      status: string;
    };
    recentTransactions: AuditTransaction[];
  };
}

export interface InvestorSummaryKPIs {
  totalInvestors: number;
  totalInvestmentAED: number;
  profitPaid: number;
  netRealizedProfitAED: number;
}
