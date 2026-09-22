export type ExpenseCategory =
  | "Delivery / Transport"
  | "Labour"
  | "Other Expense"
  | "India Expense"
  | "Transfer / Conversion";

export type ExpenseStatus = "CLEARED" | "PENDING" | "DRAFT";

export interface ExpenseRecord {
  id: string;
  business: string;
  businessEntity: string;
  entityLabel: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  cycle: string;
  ref: string;
  amountAED: number;
  status: ExpenseStatus;
  selected?: boolean;
  details: {
    settledAmount: number;
    settlementCurrency: string;
    disbursedBy: string;
    expenseClassification: string;
    cycleAllocation: string;
    cycleCategoryDistribution: {
      deliveryFreight: number;
      labourVault: number;
      processingAssaying: number;
      indiaRealizationExp: number;
      transferFxFees: number;
    };
    cycleMarginalImpact: {
      cycleGrossSpread: number;
      thisRecord: number;
      totalCycleExpenses: number;
      netCycleProfit: number;
      netCycleMargin: number;
    };
    linkedContracts: {
      purchaseId: string;
      purchaseCostAED: number;
      saleId: string;
      saleRealizationAED: number;
      cycleId: string;
      cycleStatus: string;
    };
  };
}

export interface ExpenseSummaryKPIs {
  totalExpensesAED: number;
  labourHandlingAED: number;
  freightLogisticsAED: number;
}
