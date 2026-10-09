import { z } from "zod";
import { ExpensePaymentStatus } from "@prisma/client";

export const createExpenseSchema = z.object({
  businessId: z
    .string()
    .min(1, "Please select a valid business entity"),
  category: z
    .string()
    .trim()
    .min(1, "Please enter an expense category")
    .max(100, "Category cannot exceed 100 characters"),
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
    .transform((val) => {
      const lower = val.toLowerCase();
      if (lower === "cash") return "Cash";
      if (lower === "card") return "Card";
      if (lower === "cheque") return "Cheque";
      return val;
    })
    .refine((val) => ["Cash", "Card", "Cheque"].includes(val), {
      message: "Payment method must be Cash, Card, or Cheque",
    })
    .optional()
    .nullable(),
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
    .string()
    .trim()
    .min(1, "Please enter an expense category")
    .max(100, "Category cannot exceed 100 characters")
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
    .transform((val) => {
      const lower = val.toLowerCase();
      if (lower === "cash") return "Cash";
      if (lower === "card") return "Card";
      if (lower === "cheque") return "Cheque";
      return val;
    })
    .refine((val) => ["Cash", "Card", "Cheque"].includes(val), {
      message: "Payment method must be Cash, Card, or Cheque",
    })
    .optional()
    .nullable(),
  isPurchaseLandedCost: z
    .boolean()
    .optional(),
});

export const expenseQuerySchema = z.object({
  businessId: z.string().optional(),
  category: z.string().optional(),
  status: z.nativeEnum(ExpensePaymentStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryParams = z.infer<typeof expenseQuerySchema>;
