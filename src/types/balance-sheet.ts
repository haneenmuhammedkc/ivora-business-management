export interface BalanceSheetItem {
  name: string;
  amountAED: number;
  drilldown?: string;
  note?: string;
  badge?: string;
  isHighlighted?: boolean;
}

export interface CapitalPositionData {
  totalCommittedCapitalAED: number;
  adminCapitalAED: number;
  adminSharePercent: number;
  partnerCapitalAED: number;
  partnerSharePercent: number;
  breakdown: BalanceSheetItem[];
}

export interface InventoryItemPosition {
  businessId: string;
  businessName: string;
  productType: string;
  remainingQuantity: number;
  carryingValueAED: number;
  averageCostPerUnitAED: number;
}

export interface InventoryPositionData {
  totalStockGrams: number;
  totalCarryingValueAED: number;
  averageCostPerGramAED: number;
  items: InventoryItemPosition[];
  breakdown: BalanceSheetItem[];
}

export interface TradingPositionData {
  realizedSalesAED: number;
  purchaseSourcingCostAED: number;
  operatingExpensesAED: number;
  operatingProfitAED: number;
  operatingMarginPercent: number;
  breakdown: BalanceSheetItem[];
}

export interface PartnerSettlementItem {
  id: string;
  partnerName: string;
  businessName: string;
  entitlementAED: number;
  disbursedAED: number;
  pendingAED: number;
}

export interface PartnerSettlementPositionData {
  totalPartnerEntitlementAED: number;
  profitDisbursedAED: number;
  pendingPartnerDisbursalAED: number;
  partners: PartnerSettlementItem[];
  breakdown: BalanceSheetItem[];
}

export interface BusinessPositionComparison {
  id: string;
  business: string;
  code: string;
  committedCapitalAED: number;
  inventoryValueAED: number;
  stockGrams: number;
  salesAED: number;
  purchaseAED: number;
  expensesAED: number;
  operatingProfitAED: number;
  pendingDisbursalAED: number;
  isConsolidated?: boolean;
}

export interface BalanceSheetSummaryKPIs {
  totalCommittedCapitalAED: number;
  inventoryCarryingValueAED: number;
  totalRealizedSalesAED: number;
  netOperatingProfitAED: number;
  pendingPartnerDisbursalAED: number;
}

export interface CompositionLegendItem {
  name: string;
  percentage: number;
  amountFormatted: string;
  colorClass: string;
}

export interface BalanceSheetResponseData {
  success: boolean;
  asOfDate: string;
  businessScope: string;
  kpis: BalanceSheetSummaryKPIs;
  capital: CapitalPositionData;
  inventory: InventoryPositionData;
  trading: TradingPositionData;
  settlement: PartnerSettlementPositionData;
  businesses: BusinessPositionComparison[];
}
