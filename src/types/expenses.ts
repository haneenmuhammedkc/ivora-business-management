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
  ref: string;
  amountAED: number;
  status: ExpenseStatus;
  selected?: boolean;
  details: {
    settledAmount: number;
    settlementCurrency: string;
    disbursedBy: string;
    expenseClassification: string;
    linkedContracts?: {
      purchaseId?: string;
      purchaseCostAED?: number;
      saleId?: string;
      saleRealizationAED?: number;
    };
  };
}

export interface ExpenseSummaryKPIs {
  totalExpensesAED: number;
  labourHandlingAED: number;
  freightLogisticsAED: number;
}
