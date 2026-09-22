export type TradingCycleStatus = "COMPLETED" | "IN PROGRESS" | "PENDING";

export interface TradingCycleRecord {
  id: string; // e.g. "TR-0248"
  business: string; // e.g. "Business 01"
  businessEntity: string; // e.g. "Business 01 (Entity A + B)"
  partnerSplit: string; // e.g. "A+B (60/40)"
  equityRatio: string; // e.g. "60% / 40%"
  purchaseId: string; // e.g. "PR-0248"
  purchaseLocation: string; // e.g. "Dubai Gold Souk • 6,500 GMS"
  purchaseCost: number; // e.g. 112000
  saleId: string; // e.g. "SL-0248" or "Pending (Zaveri Escort)"
  saleLocation: string; // e.g. "Zaveri Bazaar India Vault"
  realizationAED: number | null; // e.g. 142000 or null
  realizationINRLakhs: string | null; // e.g. "₹ 32.28L" or null
  quantityGms: number; // e.g. 6500
  commodity: string; // e.g. "999.9 Bullion"
  productType: string; // e.g. "Gold Bullion" or "Gold Grain 995"
  grossProfit: number | null; // e.g. 30000
  expenses: number | null; // e.g. 6000
  netProfit: number | null; // e.g. 24000
  marginPercent: number | null; // e.g. 16.90
  status: TradingCycleStatus;
  selected?: boolean;
  matchId: string; // e.g. "MATCH ID #9042"
  inrNominalRealized: string; // e.g. "₹ 32,28,000.00"
  executionCrossRate: string; // e.g. "₹ 22.7400 / AED"
  fxSlippageVariance: string; // e.g. "0.00 BPS (Fixed Contract)"
  fxSettlementStatus: string; // e.g. "CLEARED & DISBURSED"
  partnerBShare: {
    name: string;
    subtext: string;
    amount: number;
    settledInfo: string;
  };
  deskRetainedShare: {
    name: string;
    subtext: string;
    amount: number;
    settledInfo: string;
  };
}

export interface TradingCycleSummaryKPIs {
  totalCycles: number;
  completedCycles: number;
  pendingCycles: number;
  netRealizedProfitAED: number;
}
