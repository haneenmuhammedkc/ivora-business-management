export type InvestorStatus = "ACTIVE" | "PENDING" | "CLEARED";
export type ParticipantType = "ADMIN" | "PARTNER" | "INVESTOR";

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
  participantType?: ParticipantType;
  name: string;
  code?: string;
  isMultiEntity?: boolean;
  emailOrSubtitle: string;
  businessId?: string;
  business: string;
  businessEntity: string;
  entityLabel: string;
  investmentAED: number;
  date: string;
  sharePercent: number | null;
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

export interface BusinessInvestorRow {
  id: string;
  name: string;
  code: string;
  businessType: string;
  description?: string | null;
  totalInvestmentAED: number;
  adminInvestmentAED: number;
  partnerInvestmentAED: number;
  partnerEquityPct: number;
  partnerId: string;
  partnerName: string;
  externalInvestorsCount: number;
  totalParticipantsCount: number;
  status: string;
  createdAt: string;
}

export interface BusinessInvestorDetails {
  id: string;
  name: string;
  code: string;
  businessType: string;
  description?: string | null;
  totalInvestmentAED: number;
  adminInvestmentAED: number;
  partnerInvestmentAED: number;
  partnerEquityPct: number;
  partner: {
    id: string;
    name: string;
    email: string;
  };
  totalExternalInvestmentAED: number;
  status: string;
  createdAt: string;
  participants: InvestorRecord[];
}

export interface InvestorSummaryKPIs {
  totalInvestors: number;
  totalInvestmentAED: number;
  profitPaid: number;
  netRealizedProfitAED: number;
}
