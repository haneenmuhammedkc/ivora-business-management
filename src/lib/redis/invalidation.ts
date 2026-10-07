import { invalidateCacheKeys, invalidateCacheByPattern } from "./cache";
import { CacheKeys } from "./keys";

const PREFIX = process.env.REDIS_KEY_PREFIX || "ivora";

/**
 * Invalidates all caches for a business including financials, reports,
 * overview KPIs, and admin/partner listings.
 */
export async function invalidateBusinessFinancials(
  businessId: string,
  partnerId?: string | null
): Promise<void> {
  const keys: (string | null | undefined)[] = [
    CacheKeys.businesses.detail(businessId),
    CacheKeys.businesses.list("ADMIN", ""),
    CacheKeys.investors.overview("ADMIN", ""),
    CacheKeys.financials.pnl(businessId),
    CacheKeys.financials.balanceSheet(businessId),
    CacheKeys.financials.reports(businessId),
    CacheKeys.financials.pnl(undefined, undefined, "ADMIN"),
    CacheKeys.financials.balanceSheet(undefined, undefined, "ADMIN"),
    CacheKeys.financials.reports(undefined, undefined, "ADMIN"),
    CacheKeys.dashboard.kpis("ADMIN", ""),
  ];

  if (partnerId) {
    keys.push(
      CacheKeys.businesses.list("PARTNER", partnerId),
      CacheKeys.investors.overview("PARTNER", partnerId),
      CacheKeys.financials.pnl(undefined, partnerId, "PARTNER"),
      CacheKeys.financials.balanceSheet(undefined, partnerId, "PARTNER"),
      CacheKeys.financials.reports(undefined, partnerId, "PARTNER"),
      CacheKeys.dashboard.kpis("PARTNER", partnerId)
    );
  }

  await invalidateCacheKeys(...keys);
}

/**
 * Invalidates transaction lists and triggers financial summary cache eviction.
 */
export async function invalidateTransactionCaches(
  businessId: string,
  moduleType: "purchases" | "sales" | "expenses",
  itemId?: string,
  partnerId?: string | null
): Promise<void> {
  const keys: (string | null | undefined)[] = [
    CacheKeys[moduleType].list(businessId),
  ];

  if (itemId) {
    if (moduleType === "purchases") keys.push(CacheKeys.purchases.detail(itemId));
    if (moduleType === "sales") keys.push(CacheKeys.sales.detail(itemId));
    if (moduleType === "expenses") keys.push(CacheKeys.expenses.detail(itemId));
  }

  await invalidateCacheKeys(...keys);
  await invalidateBusinessFinancials(businessId, partnerId);
}

/**
 * Invalidates investor lists and dependent financial sheets.
 */
export async function invalidateInvestorCaches(
  businessId: string,
  partnerId?: string | null
): Promise<void> {
  const keys: (string | null | undefined)[] = [
    CacheKeys.investors.business(businessId),
    CacheKeys.investors.overview("ADMIN", ""),
    CacheKeys.businesses.detail(businessId),
    CacheKeys.financials.balanceSheet(businessId),
    CacheKeys.financials.reports(businessId),
    CacheKeys.dashboard.kpis("ADMIN", ""),
  ];

  if (partnerId) {
    keys.push(
      CacheKeys.investors.overview("PARTNER", partnerId),
      CacheKeys.financials.balanceSheet(undefined, partnerId, "PARTNER"),
      CacheKeys.dashboard.kpis("PARTNER", partnerId)
    );
  }

  await invalidateCacheKeys(...keys);
}

/**
 * Deep invalidation: clears all cached keys prefixed by a business ID.
 */
export async function invalidateAllBusinessScoped(
  businessId: string,
  partnerId?: string | null
): Promise<void> {
  await invalidateCacheByPattern(`${PREFIX}:biz:${businessId}:*`);
  await invalidateBusinessFinancials(businessId, partnerId);
}
