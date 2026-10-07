export interface PartnerShare {
  name: string;
  sharePercentage: number;
}

export interface BusinessEntity {
  id: string;
  name: string;
  code: string;
  businessType?: string;
  description?: string | null;
  subtitle: string;
  partnerName?: string;
  partners: PartnerShare[];
  partnersSummary: string;
  totalInvestmentAED?: number;
  adminInvestmentAED?: number;
  partnerInvestmentAED?: number;
  investmentAED: number;
  purchaseCostAED: number;
  salesIndiaAED: number;
  expensesAED: number;
  netProfitAED: number;
  marginPercentage: number;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  createdAt: string;
  productType: string;
  locationRoute: string;
}

export interface BusinessesSummaryKPIs {
  totalBusinesses: number;
  activeBusinesses: number;
  totalPartners: number;
  combinedInvestmentAED: number;
  combinedNetProfitAED: number;
}

export interface BusinessTradingCycleSummary {
  id: string;
  cycleCode: string;
  status: string;
  startDate: string | Date;
  completionDate: string | Date | null;
  grossRealizationAed: number | string | null;
  purchaseLandedCostAed: number | string | null;
  directExpensesAed: number | string | null;
  grossArbitrageSpreadAed: number | string | null;
  netProfitAed: number | string | null;
  investorShareTotalAed: number | string | null;
  deskRetainedProfitAed: number | string | null;
}

export interface BusinessPurchaseSummary {
  id: string;
  purchaseCode: string;
  purchaseDate: string | Date;
  sourcingVault: string;
  productType: string;
  quantityGms: number | string;
  basePricePerGm: number | string;
  baseAcquisitionValue: number | string;
  transitInsuranceFreight: number | string;
  vaultHandlingLabour: number | string;
  customsSecurity: number | string;
  totalLandedCost: number | string;
  status: string;
}

export interface BusinessSaleSummary {
  id: string;
  saleCode: string;
  saleDate: string | Date;
  liquidationDesk: string;
  buyerFirm: string;
  productType: string;
  quantityGms: number | string;
  sellingPricePerGm: number | string;
  inrRealizationValue: number | string;
  realizedFxRate: number | string;
  aedEquivalent: number | string;
  status: string;
}

export interface BusinessExpenseSummary {
  id: string;
  expenseCode: string;
  category: string;
  description: string;
  refNo: string | null;
  amount: number | string;
  expenseDate: string | Date;
  status: string;
  isPurchaseLandedCost: boolean;
}

export interface BusinessInvestorSummary {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  type: string;
  defaultSharePct: number | string | null;
  status: string;
}

export interface BusinessInvestmentSummary {
  id: string;
  investorId: string;
  committedAmount: number | string;
  profitSharePct: number | string;
  allocatedGrams: number | string | null;
  depositDate: string | Date;
  status: string;
  investor: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
}

export interface BusinessTransactionSummary {
  id: string;
  transactionCode: string;
  amount: number | string;
  type: string;
  paymentMethod: string;
  bankReference: string | null;
  escrowAccount: string | null;
  transactionDate: string | Date;
}

export interface BusinessWorkspaceDetail {
  id: string;
  name: string;
  code: string;
  businessType: string;
  description: string | null;
  subtitle: string;
  totalInvestmentAED: number;
  adminInvestmentAED: number;
  partnerInvestmentAED: number;
  investmentAED: number;
  purchaseCostAED: number;
  salesIndiaAED: number;
  expensesAED: number;
  netProfitAED: number;
  marginPercentage: number;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  partnerId: string;
  partnerName: string;
  partnersSummary: string;
  partnerEquityPct: number;
  adminEquityPct: number;
  createdAt: string | Date;
  createdAtFormatted: string;
  partner?: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
  investors: BusinessInvestorSummary[];
  investments: BusinessInvestmentSummary[];
  tradingCycles: BusinessTradingCycleSummary[];
  purchases: BusinessPurchaseSummary[];
  sales: BusinessSaleSummary[];
  expenses: BusinessExpenseSummary[];
  transactions: BusinessTransactionSummary[];
}
