import {
  BalanceSheetSummaryKPIs,
  BalanceSheetStatementData,
  BusinessPositionComparison,
  CompositionLegendItem,
} from "@/types/balance-sheet";

export const mockBalanceSheetKPIs: BalanceSheetSummaryKPIs = {
  totalAssetsAED: 270000,
  totalLiabilitiesAED: 40000,
  totalEquityAED: 230000,
  balanceCheckAED: 0,
};

export const mockBalanceSheetStatement: BalanceSheetStatementData = {
  currentAssets: [
    {
      name: "Cash / AED Liquidity",
      amountAED: 72000,
      drilldown:
        "Drill-down: ENBD Operating Account: AED 58,000 | DXB Vault Float: AED 14,000",
      badge: "Immediate Liquidity",
    },
    {
      name: "Gold / Physical Inventory",
      amountAED: 150000,
      drilldown:
        "Detailed callout: 6,840 GMS Fine 999.9 Bullion held across DXB Vaults",
      note: "Linked to PR-0246 unsold physical allocation • Insured under Transguard SLA",
      isHighlighted: true,
    },
    {
      name: "Trade Receivables",
      amountAED: 38000,
      drilldown:
        "India Sale Receivables: AED 25,000 | Other Trade Receivables: AED 13,000",
      badge: "T+2 Settlement",
    },
    {
      name: "Other Current Assets",
      amountAED: 2000,
      drilldown: "Customs clearing security deposits & transit risk insurance float",
      badge: "DIFC Held",
    },
  ],
  totalCurrentAssetsAED: 262000,
  nonCurrentAssets: [
    {
      name: "Other Long-Term Assets / Vault Equipment",
      amountAED: 8000,
      drilldown:
        "High-precision spectroscopic testing assay hardware & vault security keys",
      badge: "Depreciated Cost",
    },
  ],
  totalNonCurrentAssetsAED: 8000,
  totalAssetsConsolidatedAED: 270000,
  currentLiabilities: [
    {
      name: "Accounts Payable",
      amountAED: 15000,
      drilldown:
        "Supplier Payables: AED 10,000 | Operating Logistics Payables: AED 5,000",
      badge: "T+5 Pending",
    },
    {
      name: "Investor Liabilities",
      amountAED: 20000,
      drilldown:
        "Allocated Profit: AED 14,940 | Unpaid Disbursal: AED 6,250 | Reserve: AED 13,750",
      note: "Drilldown active to Partner B & Partner C sub-ledgers",
      isHighlighted: true,
    },
    {
      name: "Other Accrued Liabilities",
      amountAED: 5000,
      drilldown:
        "DIFC commercial licensing provisions & legal compliance accruals",
      badge: "Statutory",
    },
  ],
  totalCurrentLiabilitiesAED: 40000,
  partnerEquity: [
    {
      name: "Partner Capital",
      amountAED: 200000,
      drilldown:
        "Consolidated contribution Partner A, B & C; strictly segregated from operational revenue",
      badge: "Committed Capital",
    },
    {
      name: "Retained Profit",
      amountAED: 22410,
      drilldown:
        "Cumulative realized net trading profit retained after investor distributions",
      badge: "Unallocated Yield",
    },
    {
      name: "Other Equity Adjustments",
      amountAED: 7590,
      drilldown:
        "Statutory reserve allocation & FX translation reserve account",
      badge: "Reserve Reserve",
    },
  ],
  totalEquityAED: 230000,
  totalLiabilitiesAndEquityConsolidatedAED: 270000,
};

export const mockBusinessPositionsList: BusinessPositionComparison[] = [
  {
    id: "biz-01",
    business: "Business 01",
    entityParticipants: "Entity A + B (Dubai Procurement & Direct Transit)",
    assetsAED: 160000,
    liabilitiesAED: 24000,
    equityAED: 136000,
    netWorkingCapitalAED: 136000,
    balanceStatus: "Balanced",
  },
  {
    id: "biz-02",
    business: "Business 02",
    entityParticipants: "Entity A + C (Secondary Trading & Bilateral Desk)",
    assetsAED: 110000,
    liabilitiesAED: 16000,
    equityAED: 94000,
    netWorkingCapitalAED: 94000,
    balanceStatus: "Balanced",
  },
  {
    id: "consolidated",
    business: "ALL BUSINESSES",
    entityParticipants: "CONSOLIDATED GROUP LEDGER",
    assetsAED: 270000,
    liabilitiesAED: 40000,
    equityAED: 230000,
    netWorkingCapitalAED: 230000,
    balanceStatus: "Balanced",
    isConsolidated: true,
  },
];

export const mockAssetCompositionLegend: CompositionLegendItem[] = [
  {
    name: "Cash",
    percentage: 26.7,
    amountFormatted: "AED 72k",
    colorClass: "bg-gray-900",
  },
  {
    name: "Bullion",
    percentage: 55.5,
    amountFormatted: "AED 150k",
    colorClass: "bg-gray-700",
  },
  {
    name: "Receivables",
    percentage: 14.1,
    amountFormatted: "AED 38k",
    colorClass: "bg-gray-400",
  },
  {
    name: "Other",
    percentage: 3.7,
    amountFormatted: "AED 10k",
    colorClass: "bg-gray-200",
  },
];

export const mockCapitalLiabilitiesLegend: CompositionLegendItem[] = [
  {
    name: "Liabilities",
    percentage: 14.8,
    amountFormatted: "AED 40k",
    colorClass: "bg-gray-400",
  },
  {
    name: "Capital",
    percentage: 74.1,
    amountFormatted: "AED 200k",
    colorClass: "bg-gray-900",
  },
  {
    name: "Retained",
    percentage: 8.3,
    amountFormatted: "AED 22.4k",
    colorClass: "bg-gray-700",
  },
  {
    name: "Reserves",
    percentage: 2.8,
    amountFormatted: "AED 7.6k",
    colorClass: "bg-gray-300",
  },
];
