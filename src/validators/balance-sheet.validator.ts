import { z } from "zod";

export const balanceSheetQuerySchema = z.object({
  businessId: z.string().optional(),
  asOfDate: z.string().optional(),
  status: z.enum(["all", "CLEARED", "PENDING"]).optional(),
  productType: z.string().optional(),
});

export type BalanceSheetQuery = z.infer<typeof balanceSheetQuerySchema>;
