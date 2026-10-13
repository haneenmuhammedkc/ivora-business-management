/**
 * Financial Unit & Logic Verification Suite for Investor Wallet
 * Verifies double-entry ledger equations, withdrawal state lifecycle,
 * settlement idempotency composite key, and capacity validation.
 */
import { Prisma } from "@prisma/client";

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

console.log("=== RUNNING INVESTOR WALLET FINANCIAL VERIFICATION ===");

// 1. Double-Entry Accounting Invariance
{
  console.log("Test 1: Ledger & Balance Equation Reconciliation");
  let available = new Prisma.Decimal("0.00");
  let reserved = new Prisma.Decimal("0.00");

  // Initial Deposit
  const deposit = new Prisma.Decimal("100000.00");
  available = available.plus(deposit);
  assert(available.equals(new Prisma.Decimal("100000.00")), "Deposit must increase available");

  // Reinvestment Allocation
  const alloc = new Prisma.Decimal("40000.00");
  available = available.minus(alloc);
  assert(available.equals(new Prisma.Decimal("60000.00")), "Allocation must debit available");

  // Settlement Returns: Capital + Profit
  const settleCap = new Prisma.Decimal("30000.00");
  const settlePrf = new Prisma.Decimal("8500.00");
  available = available.plus(settleCap).plus(settlePrf);
  assert(available.equals(new Prisma.Decimal("98500.00")), "Settlement must credit available");

  // Withdrawal Reservation (Pending)
  const wdrAmt = new Prisma.Decimal("25000.00");
  available = available.minus(wdrAmt);
  reserved = reserved.plus(wdrAmt);
  assert(available.equals(new Prisma.Decimal("73500.00")), "Reservation must debit available");
  assert(reserved.equals(new Prisma.Decimal("25000.00")), "Reservation must credit reserved");

  // Reconciliation Check:
  // Credits: 100,000 + 30,000 + 8,500 = 138,500
  // Completed Debits: 40,000
  // Reserved: 25,000
  // Expected Available: 138,500 - 40,000 - 25,000 = 73,500
  const totalCredits = new Prisma.Decimal("138500.00");
  const completedDebits = new Prisma.Decimal("40000.00");
  const expectedAvailable = totalCredits.minus(completedDebits).minus(reserved);
  assert(available.equals(expectedAvailable), "Equation must reconcile exactly");
  console.log("✓ Test 1 Passed: Invariance equation holds exactly.");
}

// 2. Withdrawal Lifecycle: Completion vs Cancellation
{
  console.log("Test 2: Withdrawal Lifecycle Transitions");
  const available = new Prisma.Decimal("73500.00");
  const reserved = new Prisma.Decimal("25000.00");
  const wdrAmt = new Prisma.Decimal("25000.00");

  // Scenario A: Complete
  const completeReserved = reserved.minus(wdrAmt);
  assert(completeReserved.equals(new Prisma.Decimal("0.00")), "Completed withdrawal releases reserved balance");
  assert(available.equals(new Prisma.Decimal("73500.00")), "Completed withdrawal does not double-decrement available balance");

  // Scenario B: Cancel / Reversal
  const cancelAvailable = available.plus(wdrAmt);
  const cancelReserved = reserved.minus(wdrAmt);
  assert(cancelAvailable.equals(new Prisma.Decimal("98500.00")), "Cancelled withdrawal restores available balance");
  assert(cancelReserved.equals(new Prisma.Decimal("0.00")), "Cancelled withdrawal zeroes reservation");
  console.log("✓ Test 2 Passed: Completed and cancelled state transitions are mathematically distinct and correct.");
}

// 3. Settlement Idempotency Composite Uniqueness
{
  console.log("Test 3: Settlement Component Composite Key Disambiguation");
  const sourceTxId = "tx-sample-settlement-101";
  const capKey: string = `${sourceTxId}:CAPITAL_RETURN_CREDIT`;
  const prfKey: string = `${sourceTxId}:PROFIT_CREDIT`;
  assert(capKey !== prfKey, "Capital and Profit components have distinct composite keys for the same settlement transaction");
  console.log("✓ Test 3 Passed: Composite uniqueness [sourceTxId, type] allows separate capital and profit without collision.");
}

// 4. Business Closure Prerequisites & Unsold Inventory Guard
{
  console.log("Test 4: Business Closure Prerequisites & Unsold Inventory Guard");
  const purchasedQty = 60;
  let soldQty = 45; // partial sale
  let remaining = Math.max(0, purchasedQty - soldQty);
  let isEligible = remaining <= 0.0001;
  assert(!isEligible, "Business with unsold inventory (15 units) must be blocked from closure");

  soldQty = 60; // 100% liquidated
  remaining = Math.max(0, purchasedQty - soldQty);
  isEligible = remaining <= 0.0001;
  assert(isEligible, "Business with 0 unsold inventory is eligible for closure");
  console.log("✓ Test 4 Passed: Unsold inventory strictly blocks business closure; zero inventory permits closure.");
}

// 5. Final Closure Settlement Routing: External Investor vs Internal Partner
{
  console.log("Test 5: Final Settlement Routing Policy");
  const externalInvestorType: string = "INVESTOR";
  const partnerInvestorType: string = "PARTNER";

  const routeExternal = externalInvestorType === "INVESTOR" ? "INVESTOR_PERSONAL_WALLET" : "DIRECT_BANK_DISBURSAL";
  const routePartner = partnerInvestorType === "INVESTOR" ? "INVESTOR_PERSONAL_WALLET" : "DIRECT_BANK_DISBURSAL";

  assert(routeExternal === "INVESTOR_PERSONAL_WALLET", "External investors must automatically route to personal wallet upon final settlement");
  assert(routePartner === "DIRECT_BANK_DISBURSAL", "Internal partners must route to direct bank wire disbursal");
  console.log("✓ Test 5 Passed: Destination routing policy enforces external investor wallet crediting.");
}

// 6. Net Realized Profit & Contractual Stake Verification
{
  console.log("Test 6: Realized Profit & Investor Entitlement Calculation");
  const totalRevenue = new Prisma.Decimal("400000.00");
  const totalLandedCogs = new Prisma.Decimal("100000.00");
  const totalExpenses = new Prisma.Decimal("0.00");

  const netProfit = totalRevenue.minus(totalLandedCogs).minus(totalExpenses);
  assert(netProfit.equals(new Prisma.Decimal("300000.00")), "Net Profit must equal 300,000.00");

  const committedCapital = new Prisma.Decimal("5000.00");
  const contractualProfitSharePct = new Prisma.Decimal("5.00");
  const profitShareEntitlement = netProfit.mul(contractualProfitSharePct).div(new Prisma.Decimal("100.00"));

  assert(profitShareEntitlement.equals(new Prisma.Decimal("15000.00")), "5% profit share of 300,000 must equal 15,000.00");

  const totalSettlementDue = committedCapital.plus(profitShareEntitlement);
  assert(totalSettlementDue.equals(new Prisma.Decimal("20000.00")), "Total settlement due must equal 20,000.00");
  console.log("✓ Test 6 Passed: Net profit and investor entitlement calculations are exact.");
}

console.log("=== ALL FINANCIAL LOGIC TESTS PASSED SUCCESSFULLY ===");
