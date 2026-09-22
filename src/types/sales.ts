export type SaleStatus = "CLEARED" | "PENDING" | "DRAFT";

export interface SaleRecord {
  id: string;
  business: string;
  partnersShare: string;
  date: string;
  cycle: string;
  commodity: string;
  locationDesk: string;
  quantityGms: number;
  priceAED: number;
  totalAED: number;
  inrRealizationFormatted: string;
  fxRate?: number;
  fxPending?: boolean;
  profitAED: number;
  status: SaleStatus;
  selected?: boolean;
}

export interface SalesSummaryKPIs {
  totalSales: number;
  indiaSalesValueAED: number;
  logisticsOverheadAED: number;
  grossProfitAED: number;
}
