import { z } from "zod";
import { ExpenseCategory, ExpensePaymentStatus } from "@prisma/client";

const ExpenseCategoryMap: Record<string, ExpenseCategory> = {
  DELIVERY_FREIGHT: ExpenseCategory.DELIVERY_FREIGHT,
  "Delivery & Freight": ExpenseCategory.DELIVERY_FREIGHT,
  "Delivery / Transport": ExpenseCategory.DELIVERY_FREIGHT,
  LABOUR_VAULT: ExpenseCategory.LABOUR_VAULT,
  Labour: ExpenseCategory.LABOUR_VAULT,
  "Labour & Vault": ExpenseCategory.LABOUR_VAULT,
  PROCESSING_ASSAYING: ExpenseCategory.PROCESSING_ASSAYING,
  "Processing & Assaying": ExpenseCategory.PROCESSING_ASSAYING,
  "Other Expense": ExpenseCategory.GENERAL_OVERHEAD,
  INDIA_EXPENSE: ExpenseCategory.INDIA_EXPENSE,
  "India Expense": ExpenseCategory.INDIA_EXPENSE,
  TRANSFER_FX_FEES: ExpenseCategory.TRANSFER_FX_FEES,
  "Transfer / Conversion": ExpenseCategory.TRANSFER_FX_FEES,
  "Transfer & FX Fees": ExpenseCategory.TRANSFER_FX_FEES,
  GENERAL_OVERHEAD: ExpenseCategory.GENERAL_OVERHEAD,
  "General Overhead": ExpenseCategory.GENERAL_OVERHEAD,
};

export const createExpenseSchema = z.object({
  businessId: z
    .string()
    .min(1, "Please select a valid business entity"),
  category: z
    .union([
      z.nativeEnum(ExpenseCategory),
      z.string(),
    ])
    .transform((val): ExpenseCategory => {
      if (typeof val === "string" && ExpenseCategoryMap[val]) {
        return ExpenseCategoryMap[val];
      }
      if (Object.values(ExpenseCategory).includes(val as ExpenseCategory)) {
        return val as ExpenseCategory;
      }
      return ExpenseCategory.GENERAL_OVERHEAD;
    }),
  description: z
    .string()
    .trim()
    .min(2, "Description must be at least 2 characters")
    .max(500, "Description cannot exceed 500 characters"),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Amount must be a positive number greater than 0",
    })
    .refine((val) => val <= 1_000_000_000, {
      message: "Amount exceeds maximum allowable limit",
    }),
  expenseDate: z
    .union([z.string(), z.date()])
    .refine(
      (val) => {
        const d = new Date(val);
        return !isNaN(d.getTime());
      },
      { message: "Please provide a valid expense date" }
    )
    .transform((val) => new Date(val)),
  status: z
    .union([
      z.nativeEnum(ExpensePaymentStatus),
      z.enum(["CLEARED", "PENDING"]),
    ])
    .optional()
    .default(ExpensePaymentStatus.CLEARED),
  paymentMethod: z
    .string()
    .trim()
    .max(100, "Payment method must not exceed 100 characters")
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  isPurchaseLandedCost: z
    .boolean()
    .optional()
    .default(false),
});

export const updateExpenseSchema = z.object({
  businessId: z
    .string()
    .min(1, "Please select a valid business entity")
    .optional(),
  category: z
    .union([
      z.nativeEnum(ExpenseCategory),
      z.string(),
    ])
    .transform((val): ExpenseCategory => {
      if (typeof val === "string" && ExpenseCategoryMap[val]) {
        return ExpenseCategoryMap[val];
      }
      if (Object.values(ExpenseCategory).includes(val as ExpenseCategory)) {
        return val as ExpenseCategory;
      }
      return ExpenseCategory.GENERAL_OVERHEAD;
    })
    .optional(),
  description: z
    .string()
    .trim()
    .min(2, "Description must be at least 2 characters")
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Amount must be a positive number greater than 0",
    })
    .refine((val) => val <= 1_000_000_000, {
      message: "Amount exceeds maximum allowable limit",
    })
    .optional(),
  expenseDate: z
    .union([z.string(), z.date()])
    .refine(
      (val) => {
        const d = new Date(val);
        return !isNaN(d.getTime());
      },
      { message: "Please provide a valid expense date" }
    )
    .transform((val) => new Date(val))
    .optional(),
  status: z
    .union([
      z.nativeEnum(ExpensePaymentStatus),
      z.enum(["CLEARED", "PENDING"]),
    ])
    .optional(),
  paymentMethod: z
    .string()
    .trim()
    .max(100, "Payment method must not exceed 100 characters")
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  isPurchaseLandedCost: z
    .boolean()
    .optional(),
});

export const expenseQuerySchema = z.object({
  businessId: z.string().optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  status: z.nativeEnum(ExpensePaymentStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryParams = z.infer<typeof expenseQuerySchema>;
