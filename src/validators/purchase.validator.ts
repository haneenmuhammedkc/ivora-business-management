import { z } from "zod";
import { QuantityUnit } from "@prisma/client";

export const QuantityUnitEnum = z.enum(["GRAM", "PIECE", "GRAMS", "PIECES"]);

export const createPurchaseSchema = z
  .object({
    businessId: z
      .string()
      .min(1, "Please select a valid business entity"),
    purchaseDate: z
      .union([z.string(), z.date()])
      .refine(
        (val) => {
          const d = new Date(val);
          return !isNaN(d.getTime());
        },
        { message: "Please provide a valid purchase date" }
      ),
    productType: z
      .string()
      .trim()
      .min(1, "Product type is required")
      .max(120, "Product type must not exceed 120 characters"),
    quantity: z
      .union([z.number(), z.string()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Quantity must be a positive number greater than 0",
      }),
    quantityUnit: z
      .union([
        z.nativeEnum(QuantityUnit),
        z.enum(["GRAM", "PIECE", "GRAMS", "PIECES"]),
      ])
      .transform((val): QuantityUnit => {
        const upper = String(val).toUpperCase();
        if (upper === "PIECE" || upper === "PIECES") {
          return QuantityUnit.PIECE;
        }
        return QuantityUnit.GRAM;
      }),
    baseAmount: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val !== undefined && typeof val === "string" ? parseFloat(val) : val)),
    basePricePerUnitAED: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val !== undefined && typeof val === "string" ? parseFloat(val) : val)),
    basePricePerGm: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val !== undefined && typeof val === "string" ? parseFloat(val) : val)),
  })
  .superRefine((data, ctx) => {
    // Unit-specific quantity rules
    if (data.quantityUnit === QuantityUnit.PIECE) {
      if (!Number.isInteger(data.quantity)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Quantity in pieces must be a whole number (integer)",
          path: ["quantity"],
        });
      }
    } else if (data.quantityUnit === QuantityUnit.GRAM) {
      const str = String(data.quantity);
      if (str.includes(".")) {
        const decimals = str.split(".")[1];
        if (decimals && decimals.length > 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Quantity in grams supports up to 3 decimal places",
            path: ["quantity"],
          });
        }
      }
    }

    // Base amount validation (required and positive)
    const effectiveBase = data.baseAmount ?? data.basePricePerUnitAED ?? data.basePricePerGm;
    if (
      effectiveBase === undefined ||
      effectiveBase === null ||
      isNaN(effectiveBase) ||
      effectiveBase <= 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Base amount is required and must be a positive number greater than 0",
        path: ["baseAmount"],
      });
    }
  });

export type CreatePurchaseValidatedInput = z.infer<typeof createPurchaseSchema>;

export const updatePurchaseSchema = z
  .object({
    businessId: z.string().min(1, "Please select a valid business entity").optional(),
    purchaseDate: z
      .union([z.string(), z.date()])
      .refine(
        (val) => {
          const d = new Date(val);
          return !isNaN(d.getTime());
        },
        { message: "Please provide a valid purchase date" }
      )
      .optional(),
    productType: z
      .string()
      .trim()
      .min(1, "Product type is required")
      .max(120, "Product type must not exceed 120 characters")
      .optional(),
    quantity: z
      .union([z.number(), z.string()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Quantity must be a positive number greater than 0",
      })
      .optional(),
    quantityUnit: z
      .union([
        z.nativeEnum(QuantityUnit),
        z.enum(["GRAM", "PIECE", "GRAMS", "PIECES"]),
      ])
      .transform((val): QuantityUnit => {
        const upper = String(val).toUpperCase();
        if (upper === "PIECE" || upper === "PIECES") {
          return QuantityUnit.PIECE;
        }
        return QuantityUnit.GRAM;
      })
      .optional(),
    baseAmount: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val !== undefined && typeof val === "string" ? parseFloat(val) : val)),
    basePricePerUnitAED: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val !== undefined && typeof val === "string" ? parseFloat(val) : val)),
    basePricePerGm: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val !== undefined && typeof val === "string" ? parseFloat(val) : val)),
  })
  .superRefine((data, ctx) => {
    // Quantity validation if provided
    if (data.quantity !== undefined) {
      if (data.quantityUnit === QuantityUnit.PIECE) {
        if (!Number.isInteger(data.quantity)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Quantity in pieces must be a whole number (integer)",
            path: ["quantity"],
          });
        }
      } else if (data.quantityUnit === QuantityUnit.GRAM) {
        const str = String(data.quantity);
        if (str.includes(".")) {
          const decimals = str.split(".")[1];
          if (decimals && decimals.length > 3) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Quantity in grams supports up to 3 decimal places",
              path: ["quantity"],
            });
          }
        }
      }
    }

    // Base amount validation if provided
    const providedBase = data.baseAmount ?? data.basePricePerUnitAED ?? data.basePricePerGm;
    if (providedBase !== undefined) {
      if (providedBase === null || isNaN(providedBase) || providedBase <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Base amount must be a positive number greater than 0",
          path: ["baseAmount"],
        });
      }
    }
  });

export type UpdatePurchaseValidatedInput = z.infer<typeof updatePurchaseSchema>;
