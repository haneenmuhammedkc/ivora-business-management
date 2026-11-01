import { getInvestorById } from "../services/investor/investor.service";
import { getInvestorSettlementOverview } from "../services/investor/settlement.service";
import { getInvestorWalletSummary } from "../services/investor/wallet.service";
import {
  getBusinessClosureEligibility,
  getBusinessInventoryLiquidationStatus,
} from "../services/business/business.service";
import { SessionPayload } from "../lib/auth/session";
import { UserRole } from "@prisma/client";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms: ${label}`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

async function main() {
  const investorId = "cmv536zhm000is85we3ut6ptu"; // Haneen
  const businessId = "cmv5358ev0006s85wrh2k2xh9"; // GOLD

  const adminSession: SessionPayload = {
    userId: "admin-user-id",
    role: UserRole.ADMIN,
    email: "admin@ivora.trade",
  };

  console.log("=== RUNNING INVESTOR DETAILS PAGE BENCHMARK (AFTER FIX) ===");

  // 1. Investor Detail Service
  const t0 = performance.now();
  const investor = await withTimeout(
    getInvestorById(adminSession, investorId),
    5000,
    "getInvestorById"
  );
  const t1 = performance.now();
  const investorTimeMs = Number((t1 - t0).toFixed(2));
  console.log(`✓ getInvestorById: ${investorTimeMs}ms (Name: ${investor.name}, Code: ${investor.code})`);

  // 2. Wallet Summary Service
  const t2 = performance.now();
  const wallet = await withTimeout(
    getInvestorWalletSummary(adminSession, investorId),
    5000,
    "getInvestorWalletSummary"
  );
  const t3 = performance.now();
  const walletTimeMs = Number((t3 - t2).toFixed(2));
  console.log(
    `✓ getInvestorWalletSummary: ${walletTimeMs}ms (Available: AED ${wallet.kpis.availableBalance}, Entries: ${wallet.recentEntries.length})`
  );

  // 3. Independent Stock Liquidation Status (Layer 0)
  const t4 = performance.now();
  const stockStatus = await withTimeout(
    getBusinessInventoryLiquidationStatus(businessId),
    5000,
    "getBusinessInventoryLiquidationStatus"
  );
  const t5 = performance.now();
  const stockTimeMs = Number((t5 - t4).toFixed(2));
  console.log(
    `✓ getBusinessInventoryLiquidationStatus: ${stockTimeMs}ms (Liquidated: ${stockStatus.isLiquidated}, Unsold: ${stockStatus.totalUnsoldQuantity})`
  );

  // 4. Business Closure Eligibility Service
  const t6 = performance.now();
  const eligibility = await withTimeout(
    getBusinessClosureEligibility(adminSession, businessId),
    5000,
    "getBusinessClosureEligibility"
  );
  const t7 = performance.now();
  const eligibilityTimeMs = Number((t7 - t6).toFixed(2));
  console.log(
    `✓ getBusinessClosureEligibility: ${eligibilityTimeMs}ms (Eligible: ${eligibility.isEligible}, Previews: ${eligibility.settlementPreviews.length})`
  );

  // 5. Settlement Overview Service
  const t8 = performance.now();
  const settlement = await withTimeout(
    getInvestorSettlementOverview(adminSession, businessId, investorId),
    5000,
    "getInvestorSettlementOverview"
  );
  const t9 = performance.now();
  const settlementTimeMs = Number((t9 - t8).toFixed(2));
  console.log(
    `✓ getInvestorSettlementOverview: ${settlementTimeMs}ms (Committed: AED ${settlement.totalInvestmentAED}, Outstanding: AED ${settlement.totalOutstandingAED})`
  );

  console.log("\n=== SUMMARY OF TIMINGS ===");
  console.log(`- Investor Details: ${investorTimeMs}ms`);
  console.log(`- Wallet Summary:   ${walletTimeMs}ms`);
  console.log(`- Inventory Check:  ${stockTimeMs}ms`);
  console.log(`- Closure Check:    ${eligibilityTimeMs}ms`);
  console.log(`- Settlement Check: ${settlementTimeMs}ms`);
  console.log(`- Total Combined:   ${(investorTimeMs + walletTimeMs + settlementTimeMs).toFixed(2)}ms`);

  console.log("\n=== BENCHMARK COMPLETED SUCCESSFULLY (NO HANGS, NO RECURSION) ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
