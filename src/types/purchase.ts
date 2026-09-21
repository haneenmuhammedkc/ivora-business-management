export type PurchaseStatus = "CLEARED" | "IN PROGRESS" | "DRAFT";

export interface PurchaseRecord {
  id: string;
  business: string;
  businessEntities: string;
  date: string;
  product: string;
  locationVault: string;
  quantityGms: number;
  basePriceAED: number;
  freightAED: number;
  labourAED: number;
  customsAED?: number;
  totalLandedAED: number;
  status: PurchaseStatus;
  selected?: boolean;
}

export interface PurchaseSummaryKPIs {
  totalPurchase: number;
  totalSourcingCostAED: number;
  logisticsOverheadAED: number;
}
