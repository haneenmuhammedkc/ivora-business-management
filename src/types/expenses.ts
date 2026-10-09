import { ExpenseCategory as PrismaExpenseCategory, ExpensePaymentStatus } from "@prisma/client";

export type ExpenseCategory =
  | PrismaExpenseCategory
  | "DELIVERY_FREIGHT"
  | "LABOUR_VAULT"
  | "PROCESSING_ASSAYING"
  | "INDIA_EXPENSE"
  | "TRANSFER_FX_FEES"
  | "GENERAL_OVERHEAD"
  | "Delivery / Transport"
  | "Delivery & Freight"
  | "Labour"
  | "Labour & Vault"
  | "Processing & Assaying"
  | "Other Expense"
  | "India Expense"
  | "Transfer / Conversion"
  | "Transfer & FX Fees"
  | "General Overhead"
  | (string & {});

export type ExpenseStatus = ExpensePaymentStatus | "CLEARED" | "PENDING";

export interface ExpenseBusiness {
  id: string;
  name: string;
  code: string;
  businessType?: string;
}

export interface ExpenseRecord {
  id: string;
  expenseCode: string;
  businessId: string;
  business?: ExpenseBusiness | string;
  businessName?: string;
  businessCode?: string;
  businessEntity?: string;
  entityLabel?: string;
  date?: string;
  expenseDate: string | Date;
  category: string;
  description: string;
  amountAED?: number;
  amount: number | string;
  status: ExpenseStatus;
  paymentMethod: string | null;
  isPurchaseLandedCost?: boolean;
  selected?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  details?: {
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

/**
 * Normalizes and extracts the human-readable Business Name from an ExpenseRecord.
 * Ensures an object is NEVER directly rendered to JSX or passed where a primitive is expected.
 */
export function getExpenseBusinessName(exp: ExpenseRecord | undefined | null): string {
  if (!exp) return "—";
  if (typeof exp.business === "object" && exp.business !== null) {
    return exp.business.name || "—";
  }
  if (typeof exp.business === "string" && exp.business.trim()) {
    return exp.business;
  }
  if (exp.businessName) {
    return exp.businessName;
  }
  return "—";
}

/**
 * Normalizes and extracts the Business Code from an ExpenseRecord.
 */
export function getExpenseBusinessCode(exp: ExpenseRecord | undefined | null): string {
  if (!exp) return "";
  if (typeof exp.business === "object" && exp.business !== null) {
    return exp.business.code || "";
  }
  if (exp.businessCode) {
    return exp.businessCode;
  }
  return exp.businessEntity || "";
}
