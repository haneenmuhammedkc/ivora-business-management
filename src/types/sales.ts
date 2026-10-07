export type SaleStatus = "CLEARED" | "PENDING" | "DRAFT";

export interface SaleRecord {
  id: string; // Sale code, e.g. SL-0001
  rawId?: string; // Database cuid
  businessId?: string;
  business: string;
  businessCode?: string;
  date: string;
  productType?: string;
  buyerFirm?: string;
  quantity?: number;
  quantityUnit?: "GRAM" | "PIECE";
  basePricePerUnitAED?: number | null;
  totalSellingPriceINR?: number;
  inrRealizationValue?: number;
  realizedFxRate?: number;
  aedEquivalent?: number;
  status: SaleStatus;
  selected?: boolean;

  // Backward-compatibility properties
  partnersShare?: string;
  commodity?: string;
  locationDesk?: string;
  quantityGms?: number | null;
  priceAED?: number;
  totalAED?: number;
  inrRealizationFormatted?: string;
  fxRate?: number;
  fxPending?: boolean;
  profitAED?: number;
}

export interface AvailableProductItem {
  productType: string;
  quantityUnit: "GRAM" | "PIECE";
  remainingQuantity: number;
  averageCostPerUnitAED: number;
  lastPurchaseDate: string | null;
}

export interface SalesSummaryKPIs {
  totalSales: number;
  indiaSalesValueAED: number;
  logisticsOverheadAED: number;
  grossProfitAED: number;
}
