import { z } from "zod";

export const profitLossQuerySchema = z.object({
  businessId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(["this_month", "last_month", "q3_2026", "ytd_2026", "all", "custom"]).optional(),
  status: z.enum(["all", "CLEARED", "PENDING"]).optional(),
  productType: z.string().optional(),
});

export type ProfitLossQuery = z.infer<typeof profitLossQuerySchema>;
