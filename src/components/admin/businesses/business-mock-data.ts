import { BusinessEntity, BusinessesSummaryKPIs } from "@/types/business";

export const initialBusinessesKPIs: BusinessesSummaryKPIs = {
  totalBusinesses: 0,
  activeBusinesses: 0,
  totalPartners: 0,
  combinedInvestmentAED: 0,
  combinedNetProfitAED: 0,
};

export const emptyBusinessesList: BusinessEntity[] = [];

// Backwards compatibility aliases
export const mockBusinessesKPIs = initialBusinessesKPIs;
export const mockBusinessesList = emptyBusinessesList;
