export type PurchaseStatus = "CLEARED" | "IN PROGRESS" | "IN_PROGRESS" | "DRAFT";
export type QuantityUnitType = "GRAM" | "PIECE";

export interface PurchaseRecord {
  id: string;
  rawId?: string;
  businessId?: string;
  business: string;
  businessCode?: string;
  businessEntities: string;
  date: string;
  product: string;
  locationVault?: string | null;
  quantity: number;
  quantityUnit: QuantityUnitType;
  quantityGms?: number | null;
  basePriceAED?: number | null;
  freightAED?: number | null;
  labourAED?: number | null;
  customsAED?: number | null;
  totalLandedAED?: number | null;
  status: PurchaseStatus;
  selected?: boolean;
}

export interface PurchaseSummaryKPIs {
  totalPurchase: number;
  totalSourcingCostAED: number;
  logisticsOverheadAED: number;
}
