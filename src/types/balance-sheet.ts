export interface BalanceSheetItem {
  name: string;
  amountAED: number;
  drilldown?: string;
  note?: string;
  badge?: string;
  isHighlighted?: boolean;
}

export interface BalanceSheetStatementData {
  currentAssets: BalanceSheetItem[];
  totalCurrentAssetsAED: number;
  nonCurrentAssets: BalanceSheetItem[];
  totalNonCurrentAssetsAED: number;
  totalAssetsConsolidatedAED: number;
  currentLiabilities: BalanceSheetItem[];
  totalCurrentLiabilitiesAED: number;
  partnerEquity: BalanceSheetItem[];
  totalEquityAED: number;
  totalLiabilitiesAndEquityConsolidatedAED: number;
}

export interface BusinessPositionComparison {
  id: string;
  business: string;
  entityParticipants: string;
  assetsAED: number;
  liabilitiesAED: number;
  equityAED: number;
  netWorkingCapitalAED: number;
  balanceStatus: "Balanced" | "Unbalanced";
  isConsolidated?: boolean;
}

export interface BalanceSheetSummaryKPIs {
  totalAssetsAED: number;
  totalLiabilitiesAED: number;
  totalEquityAED: number;
  balanceCheckAED: number;
}

export interface CompositionLegendItem {
  name: string;
  percentage: number;
  amountFormatted: string;
  colorClass: string;
}
