import { z } from "zod";
import { QuantityUnit, SaleStatus } from "@prisma/client";

/**
 * Standardize quantity unit values.
 */
export const normalizeSaleQuantityUnit = (
  unit: unknown
): QuantityUnit => {
  if (typeof unit === "string") {
    const upper = unit.toUpperCase().trim();
    if (upper === "PIECE" || upper === "PIECES" || upper === "PCS") {
      return QuantityUnit.PIECE;
    }
  }
  return QuantityUnit.GRAM;
};

/**
 * Helper to ensure a number has at most N decimal places.
 */
const hasAtMostDecimals = (val: number, maxDecimals: number): boolean => {
  const str = val.toString();
  if (!str.includes(".")) return true;
  const decimals = str.split(".")[1];
  return decimals ? decimals.length <= maxDecimals : true;
};

/**
 * Zod Schema for Creating a New Sale.
 */
export const createSaleSchema = z
  .object({
    businessId: z.string().min(1, "Assigned Business is required"),
    saleDate: z
      .union([z.date(), z.string()])
      .refine(
        (val) => {
          const d = new Date(val);
          return !isNaN(d.getTime());
        },
        { message: "Please provide a valid sale date" }
      )
      .transform((val) => new Date(val)),
    productType: z
      .string()
      .trim()
      .min(1, "Product type is required")
      .max(120, "Product type must not exceed 120 characters"),
    buyerFirm: z
      .string()
      .trim()
      .min(1, "Buyer / Clearing Firm is required")
      .max(200, "Buyer / Clearing Firm must not exceed 200 characters"),
    quantity: z
      .union([z.number(), z.string()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Quantity must be a positive number greater than 0",
      }),
    quantityUnit: z
      .union([
        z.nativeEnum(QuantityUnit),
        z.enum(["GRAM", "PIECE", "GRAMS", "PIECES", "PCS", "GMS"]),
      ])
      .transform(normalizeSaleQuantityUnit)
      .default(QuantityUnit.GRAM),
    totalSellingPriceINR: z
      .union([z.number(), z.string()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Total Selling Price (INR) must be a positive number greater than 0",
      })
      .refine(
        (val) => hasAtMostDecimals(val, 2),
        "Total Selling Price cannot have more than 2 decimal places"
      ),
    realizedFxRate: z
      .union([z.number(), z.string()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Realized FX Rate must be a positive number greater than 0",
      })
      .refine(
        (val) => hasAtMostDecimals(val, 4),
        "FX Rate cannot have more than 4 decimal places"
      ),
    basePricePerUnitAED: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((val) => (val ? (typeof val === "string" ? parseFloat(val) : val) : null)),
    inrRealizationValue: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((val) => (val ? (typeof val === "string" ? parseFloat(val) : val) : null)),
    saleCode: z.string().optional(),
    liquidationDesk: z.string().optional().nullable(),
    status: z.nativeEnum(SaleStatus).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.quantityUnit === QuantityUnit.PIECE) {
      if (!Number.isInteger(data.quantity)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["quantity"],
          message: "Quantity in pieces must be a whole integer",
        });
      }
    } else {
      if (!hasAtMostDecimals(data.quantity, 3)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["quantity"],
          message: "Quantity in grams cannot exceed 3 decimal places",
        });
      }
    }
  });

/**
 * Zod Schema for Updating an Existing Sale.
 */
export const updateSaleSchema = z
  .object({
    businessId: z.string().min(1).optional(),
    saleDate: z
      .union([z.date(), z.string()])
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          const d = new Date(val);
          return !isNaN(d.getTime());
        },
        { message: "Please provide a valid sale date" }
      )
      .transform((val) => (val ? new Date(val) : undefined)),
    productType: z.string().min(1).optional(),
    buyerFirm: z.string().min(1).optional(),
    quantity: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val !== undefined ? (typeof val === "string" ? parseFloat(val) : val) : undefined))
      .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
        message: "Quantity must be a positive number greater than 0",
      }),
    quantityUnit: z
      .union([
        z.nativeEnum(QuantityUnit),
        z.enum(["GRAM", "PIECE", "GRAMS", "PIECES", "PCS", "GMS"]),
      ])
      .transform(normalizeSaleQuantityUnit)
      .optional(),
    totalSellingPriceINR: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val !== undefined ? (typeof val === "string" ? parseFloat(val) : val) : undefined))
      .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
        message: "Total Selling Price must be a positive number greater than 0",
      })
      .refine(
        (val) => val === undefined || hasAtMostDecimals(val, 2),
        "Total Selling Price cannot have more than 2 decimal places"
      ),
    realizedFxRate: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val !== undefined ? (typeof val === "string" ? parseFloat(val) : val) : undefined))
      .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
        message: "Realized FX Rate must be a positive number greater than 0",
      })
      .refine(
        (val) => val === undefined || hasAtMostDecimals(val, 4),
        "FX Rate cannot have more than 4 decimal places"
      ),
    basePricePerUnitAED: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((val) => (val ? (typeof val === "string" ? parseFloat(val) : val) : null)),
    inrRealizationValue: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((val) => (val ? (typeof val === "string" ? parseFloat(val) : val) : null)),
    liquidationDesk: z.string().optional().nullable(),
    status: z.nativeEnum(SaleStatus).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.quantity !== undefined && data.quantityUnit !== undefined) {
      if (data.quantityUnit === QuantityUnit.PIECE) {
        if (!Number.isInteger(data.quantity)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["quantity"],
            message: "Quantity in pieces must be a whole integer",
          });
        }
      } else {
        if (!hasAtMostDecimals(data.quantity, 3)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["quantity"],
            message: "Quantity in grams cannot exceed 3 decimal places",
          });
        }
      }
    }
  });

export type CreateSaleSchemaInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleSchemaInput = z.infer<typeof updateSaleSchema>;
