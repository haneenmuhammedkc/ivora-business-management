import {
  BusinessProfitability,
  TradingCycleProfitability,
  ProfitLossSummaryKPIs,
  ProfitLossStatementData,
} from "@/types/profit-loss";

export const mockProfitLossKPIs: ProfitLossSummaryKPIs = {
  totalSalesAED: 120000,
  purchaseCostAED: 245000,
  totalExpensesAED: 245000,
  grossProfitAED: 245000,
  netProfitAED: 245000,
};

export const mockBusinessProfitabilityList: BusinessProfitability[] = [
  {
    id: "biz-01",
    name: "Business 01 (A + B)",
    salesAED: 142000,
    purchaseAED: 112000,
    expensesAED: 6000,
    grossProfitAED: 30000,
    netProfitAED: 24000,
    netMarginPercent: 16.9,
  },
  {
    id: "biz-02",
    name: "Business 02 (A + C)",
    salesAED: 93600,
    purchaseAED: 73400,
    expensesAED: 6850,
    grossProfitAED: 20200,
    netProfitAED: 13350,
    netMarginPercent: 14.26,
  },
  {
    id: "consolidated",
    name: "CONSOLIDATED ALL",
    salesAED: 235600,
    purchaseAED: 185400,
    expensesAED: 12850,
    grossProfitAED: 50200,
    netProfitAED: 37350,
    netMarginPercent: 15.85,
    isConsolidated: true,
  },
];

export const mockTradingCyclePLList: TradingCycleProfitability[] = [
  {
    cycleRef: "TR-0248",
    entity: "Business 01",
    purchaseAED: 112000,
    realizationAED: 142000,
    expensesAED: 6000,
    grossAED: 30000,
    netAED: 24000,
    status: "COMPLETED",
  },
  {
    cycleRef: "TR-0247",
    entity: "Business 02",
    purchaseAED: 73400,
    realizationAED: 93600,
    expensesAED: 6850,
    grossAED: 20200,
    netAED: 13350,
    status: "COMPLETED",
  },
];

export const mockProfitLossStatement: ProfitLossStatementData = {
  tradingRevenue: [
    {
      title: "India Sales / Realization Protocol (3 cycles)",
      amountAED: 235600,
    },
  ],
  totalRevenueAED: 235600,
  costOfBullion: [
    {
      title: "Dubai Physical Bullion Purchase (999.9 Fine Sourcing)",
      amountAED: 185400,
    },
  ],
  totalPurchaseCostAED: 185400,
  grossProfitAED: 50200,
  grossSpreadMarginPercent: 21.31,
  operatingExpenses: [
    { title: "Delivery / Armored Transport Protocol", amountAED: 1150 },
    { title: "Physical Vault Secure Custody & Labour", amountAED: 850 },
    { title: "Dubai Customs Clearing Expenses", amountAED: 4000 },
    { title: "India Realization & Port Demurrage Costs", amountAED: 4000 },
    { title: "Transfer, Banking & FX Hedging Spreads", amountAED: 1650 },
    { title: "Processing & Assaying Certification", amountAED: 1200 },
  ],
  totalExpensesAED: 12850,
  auditedNetProfitAED: 37350,
  netMarginPercent: 15.85,
  investorShareAED: 14940,
  investorSharePercent: 40.0,
  netDeskRetainedProfitAED: 22410,
  deskRetainedPercent: 60.0,
};
