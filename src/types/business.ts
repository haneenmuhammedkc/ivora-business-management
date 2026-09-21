export interface PartnerShare {
  name: string;
  sharePercentage: number;
}

export interface BusinessEntity {
  id: string;
  name: string;
  code: string;
  subtitle: string;
  partners: PartnerShare[];
  partnersSummary: string;
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
