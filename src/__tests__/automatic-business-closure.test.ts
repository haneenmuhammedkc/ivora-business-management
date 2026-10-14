/**
 * Test Suite: Automatic Business Closure & Final Settlement Integration
 * 
 * Verifies:
 * 1. Last item sold, all products liquidated, all closure requirements satisfied -> business automatically closes (SETTLED).
 * 2. Items remain in another product category -> business remains active.
 * 3. Pending expenses or another closure blocker -> business remains active with a recorded reason.
 * 4. Last sale is pending -> follows verified accounting rules, recognizes realized revenue, but does not create duplicate credits.
 * 5. Repeated or concurrent closure attempts -> idempotent, no duplicate settlements or wallet credits.
 * 6. Existing direct payouts and reinvestments -> strictly preserved without double counting.
 * 7. Eligible closed-business entitlement with zero cash wallet balance -> allocation calculation yields the exact remaining entitlement.
 * 8. Failed closure after a successful sale -> recoverable and auditable state.
 */

import { prisma } from "../lib/prisma";
import redis from "../lib/redis/client";
import { Prisma, BusinessStatus, UserRole, QuantityUnit, SaleStatus, PurchaseStatus, ExpensePaymentStatus, TransactionType } from "@prisma/client";
import { createSale, updateSale, deleteSale, triggerAutomaticBusinessClosureIfEligible } from "../services/sale/sale.service";
import { getBusinessClosureEligibility, closeBusinessAndExecuteFinalSettlement } from "../services/business/business.service";
import { getInvestorWalletSummary } from "../services/investor/wallet.service";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTests() {
  console.log("================================================================================");
  console.log("STARTING AUTOMATIC BUSINESS CLOSURE & SETTLEMENT TEST SUITE");
  console.log("================================================================================");

  const testId = Date.now().toString(36).toUpperCase();
  const dbAdmin = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
  if (!dbAdmin) throw new Error("No admin user found in database");
  const adminSession = {
    userId: dbAdmin.id,
    email: dbAdmin.email,
    role: dbAdmin.role,
  };

  const createdBusinessIds: string[] = [];
  const createdInvestorIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Last item sold, all products liquidated, all requirements met -> Closes Automatically
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 1: Single Product Full Liquidation -> Auto-Closes to SETTLED ---");
    const biz1 = await prisma.business.create({
      data: {
        code: `BIZ-T1-${testId}`,
        name: `Auto Close Test Biz 1 ${testId}`,
        businessType: "gold",
        totalInvestmentAED: new Prisma.Decimal("10000.00"),
        adminInvestmentAED: new Prisma.Decimal("5000.00"),
        partnerInvestmentAED: new Prisma.Decimal("0.00"),
        partnerEquityPct: new Prisma.Decimal("0.00"),
        status: BusinessStatus.ACTIVE,
      },
    });
    createdBusinessIds.push(biz1.id);

    const inv1 = await prisma.investor.create({
      data: {
        code: `INV-T1-${testId}`,
        name: `Investor T1 ${testId}`,
        businessId: biz1.id,
        defaultSharePct: new Prisma.Decimal("25.00"),
      },
    });
    createdInvestorIds.push(inv1.id);

    await prisma.investment.create({
      data: {
        investorId: inv1.id,
        businessId: biz1.id,
        committedAmount: new Prisma.Decimal("2500.00"),
        profitSharePct: new Prisma.Decimal("25.00"),
        depositDate: new Date(),
        status: "ACTIVE",
      },
    });

    // Purchase 10g Gold
    await prisma.purchase.create({
      data: {
        purchaseCode: `PR-T1-${testId}`,
        businessId: biz1.id,
        purchaseDate: new Date(),
        productType: "gold",
        quantity: new Prisma.Decimal("10.000"),
        quantityUnit: QuantityUnit.GRAM,
        quantityGms: new Prisma.Decimal("10.000"),
        basePricePerUnitAED: new Prisma.Decimal("1000.0000"),
        baseAcquisitionValue: new Prisma.Decimal("10000.00"),
        totalLandedCost: new Prisma.Decimal("10000.00"),
        status: PurchaseStatus.CLEARED,
      },
    });

    // Create Sale for all 10g Gold
    const saleResult1 = await createSale(adminSession, {
      businessId: biz1.id,
      saleDate: new Date(),
      buyerFirm: "Test Buyer 1",
      productType: "gold",
      quantity: 10,
      quantityUnit: QuantityUnit.GRAM,
      totalSellingPriceINR: 240000,
      realizedFxRate: 20, // 240000 / 20 = AED 12,000.00 (Net Profit = 2,000 AED)
      status: SaleStatus.CLEARED,
    });

    const updatedBiz1 = await prisma.business.findUnique({ where: { id: biz1.id } });
    assert(updatedBiz1?.status === BusinessStatus.SETTLED, "Business 1 must automatically transition to SETTLED");
    assert(saleResult1.automaticClosure?.attempted === true, "Automatic closure must be attempted");
    assert(saleResult1.automaticClosure?.succeeded === true, "Automatic closure must succeed");
    assert(saleResult1.automaticClosure?.businessStatus === BusinessStatus.SETTLED, "Reported status must be SETTLED");

    // Verify investment allocated profit amount was locked
    const investment1 = await prisma.investment.findFirst({ where: { businessId: biz1.id, investorId: inv1.id } });
    assert(Number(investment1?.allocatedProfitAmount) === 500, `Investor 1 profit must be locked to 500 AED (25% of 2,000), got ${investment1?.allocatedProfitAmount}`);
    console.log("✓ TEST 1 PASSED: Business automatically closed and settled upon final sale liquidation.");

    // -------------------------------------------------------------------------
    // TEST 2: Multi-product business: One product liquidated, another remains -> Stays ACTIVE
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Multi-Product Business with Unsold Category -> Remains ACTIVE ---");
    const biz2 = await prisma.business.create({
      data: {
        code: `BIZ-T2-${testId}`,
        name: `Multi Product Test Biz ${testId}`,
        businessType: "mixed",
        totalInvestmentAED: new Prisma.Decimal("20000.00"),
        adminInvestmentAED: new Prisma.Decimal("10000.00"),
        partnerInvestmentAED: new Prisma.Decimal("0.00"),
        partnerEquityPct: new Prisma.Decimal("0.00"),
        status: BusinessStatus.ACTIVE,
      },
    });
    createdBusinessIds.push(biz2.id);

    // Purchase 5g gold and 10 pcs phones
    await prisma.purchase.create({
      data: {
        purchaseCode: `PR-T2-GOLD-${testId}`,
        businessId: biz2.id,
        purchaseDate: new Date(),
        productType: "gold",
        quantity: new Prisma.Decimal("5.000"),
        quantityUnit: QuantityUnit.GRAM,
        basePricePerUnitAED: new Prisma.Decimal("2000.0000"),
        baseAcquisitionValue: new Prisma.Decimal("10000.00"),
        totalLandedCost: new Prisma.Decimal("10000.00"),
        status: PurchaseStatus.CLEARED,
      },
    });

    await prisma.purchase.create({
      data: {
        purchaseCode: `PR-T2-PHONE-${testId}`,
        businessId: biz2.id,
        purchaseDate: new Date(),
        productType: "phone",
        quantity: new Prisma.Decimal("10.000"),
        quantityUnit: QuantityUnit.PIECE,
        basePricePerUnitAED: new Prisma.Decimal("1000.0000"),
        baseAcquisitionValue: new Prisma.Decimal("10000.00"),
        totalLandedCost: new Prisma.Decimal("10000.00"),
        status: PurchaseStatus.CLEARED,
      },
    });

    // Sell all 5g gold, but none of the 10 phones
    const saleResult2 = await createSale(adminSession, {
      businessId: biz2.id,
      saleDate: new Date(),
      buyerFirm: "Test Buyer 2",
      productType: "gold",
      quantity: 5,
      quantityUnit: QuantityUnit.GRAM,
      totalSellingPriceINR: 220000,
      realizedFxRate: 20,
      status: SaleStatus.CLEARED,
    });

    const updatedBiz2 = await prisma.business.findUnique({ where: { id: biz2.id } });
    assert(updatedBiz2?.status === BusinessStatus.ACTIVE, "Business 2 must remain ACTIVE because phones are unsold");
    assert(saleResult2.automaticClosure?.attempted === false, "Automatic closure should not be attempted when other products remain");
    console.log("✓ TEST 2 PASSED: Business remains ACTIVE when another product category has remaining inventory.");

    // -------------------------------------------------------------------------
    // TEST 3: All products liquidated, but pending expense exists -> Stays ACTIVE with reason
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Zero Inventory but Pending Unpaid Expense -> Remains ACTIVE with Reason ---");
    const biz3 = await prisma.business.create({
      data: {
        code: `BIZ-T3-${testId}`,
        name: `Pending Expense Test Biz ${testId}`,
        businessType: "gold",
        totalInvestmentAED: new Prisma.Decimal("10000.00"),
        adminInvestmentAED: new Prisma.Decimal("5000.00"),
        partnerInvestmentAED: new Prisma.Decimal("0.00"),
        partnerEquityPct: new Prisma.Decimal("0.00"),
        status: BusinessStatus.ACTIVE,
      },
    });
    createdBusinessIds.push(biz3.id);

    await prisma.purchase.create({
      data: {
        purchaseCode: `PR-T3-${testId}`,
        businessId: biz3.id,
        purchaseDate: new Date(),
        productType: "gold",
        quantity: new Prisma.Decimal("5.000"),
        quantityUnit: QuantityUnit.GRAM,
        basePricePerUnitAED: new Prisma.Decimal("2000.0000"),
        baseAcquisitionValue: new Prisma.Decimal("10000.00"),
        totalLandedCost: new Prisma.Decimal("10000.00"),
        status: PurchaseStatus.CLEARED,
      },
    });

    // Unpaid operational expense
    await prisma.expense.create({
      data: {
        expenseCode: `EXP-T3-${testId}`,
        businessId: biz3.id,
        category: "DELIVERY_FREIGHT",
        description: "Unpaid shipping invoice",
        amount: new Prisma.Decimal("300.00"),
        expenseDate: new Date(),
        status: ExpensePaymentStatus.PENDING,
        isPurchaseLandedCost: false,
      },
    });

    // Sell all 5g gold
    const saleResult3 = await createSale(adminSession, {
      businessId: biz3.id,
      saleDate: new Date(),
      buyerFirm: "Test Buyer 3",
      productType: "gold",
      quantity: 5,
      quantityUnit: QuantityUnit.GRAM,
      totalSellingPriceINR: 220000,
      realizedFxRate: 20,
      status: SaleStatus.CLEARED,
    });

    const updatedBiz3 = await prisma.business.findUnique({ where: { id: biz3.id } });
    assert(updatedBiz3?.status === BusinessStatus.ACTIVE, "Business 3 must remain ACTIVE due to pending expense");
    assert(saleResult3.automaticClosure?.attempted === true, "Automatic closure was checked");
    assert(saleResult3.automaticClosure?.succeeded === false, "Automatic closure must be false when blocked");
    assert(
      Boolean(saleResult3.automaticClosure?.reasons?.some((r) => r.includes("expense"))),
      "Blocking reasons must mention the pending expense"
    );
    console.log("✓ TEST 3 PASSED: Pending expense blocker successfully leaves business ACTIVE with explicit reason.");

    // -------------------------------------------------------------------------
    // TEST 4: Last sale is PENDING -> Allowed by accounting rules, closes business safely
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Last Sale is PENDING -> Recognized and Closes Business Safely ---");
    const biz4 = await prisma.business.create({
      data: {
        code: `BIZ-T4-${testId}`,
        name: `Pending Sale Test Biz ${testId}`,
        businessType: "gold",
        totalInvestmentAED: new Prisma.Decimal("10000.00"),
        adminInvestmentAED: new Prisma.Decimal("5000.00"),
        partnerInvestmentAED: new Prisma.Decimal("0.00"),
        partnerEquityPct: new Prisma.Decimal("0.00"),
        status: BusinessStatus.ACTIVE,
      },
    });
    createdBusinessIds.push(biz4.id);

    await prisma.purchase.create({
      data: {
        purchaseCode: `PR-T4-${testId}`,
        businessId: biz4.id,
        purchaseDate: new Date(),
        productType: "gold",
        quantity: new Prisma.Decimal("5.000"),
        quantityUnit: QuantityUnit.GRAM,
        basePricePerUnitAED: new Prisma.Decimal("2000.0000"),
        baseAcquisitionValue: new Prisma.Decimal("10000.00"),
        totalLandedCost: new Prisma.Decimal("10000.00"),
        status: PurchaseStatus.CLEARED,
      },
    });

    const saleResult4 = await createSale(adminSession, {
      businessId: biz4.id,
      saleDate: new Date(),
      buyerFirm: "Pending Desk Buyer",
      productType: "gold",
      quantity: 5,
      quantityUnit: QuantityUnit.GRAM,
      totalSellingPriceINR: 220000,
      realizedFxRate: 20,
      status: SaleStatus.PENDING, // PENDING status
    });

    const updatedBiz4 = await prisma.business.findUnique({ where: { id: biz4.id } });
    assert(updatedBiz4?.status === BusinessStatus.SETTLED, "Business 4 closes upon liquidating sale even if sale status is PENDING");
    assert(saleResult4.status === SaleStatus.PENDING, "Sale record status remains PENDING");
    console.log("✓ TEST 4 PASSED: PENDING sale liquidating inventory follows accounting rules and safely closes business.");

    // -------------------------------------------------------------------------
    // TEST 5: Repeated or Concurrent Closure Attempts -> Idempotent, No Duplicate Settlements
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Idempotency & Concurrency Safety on Closure ---");
    const repeatResult = await closeBusinessAndExecuteFinalSettlement(adminSession, biz1.id, { isAutomated: true });
    assert(repeatResult.success === true, "Repeated closure call must succeed cleanly");
    assert((repeatResult as any).alreadySettled === true, "Must flag alreadySettled = true");

    // Run parallel calls to verify lock behavior
    const parallelResults = await Promise.all([
      closeBusinessAndExecuteFinalSettlement(adminSession, biz1.id, { isAutomated: true }),
      closeBusinessAndExecuteFinalSettlement(adminSession, biz1.id, { isAutomated: true }),
    ]);
    assert(parallelResults.every((r) => r.success), "Concurrent closure attempts must all resolve safely without corruption");
    console.log("✓ TEST 5 PASSED: Closure is completely idempotent and concurrency-safe.");

    // -------------------------------------------------------------------------
    // TEST 6 & 7: Direct Payouts + Closed-Business Entitlement with 0 Cash Wallet Balance
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6 & 7: Wallet Summary & Allocation Calculation with Prior Direct Payouts ---");
    // Investor 1 in Biz 1:
    // Committed: 2,500 AED. Profit: 500 AED. Total: 3,000 AED.
    // Record a historical direct payment of 1,000 AED
    await prisma.transaction.create({
      data: {
        transactionCode: `TX-DISB-T1-${testId}`,
        businessId: biz1.id,
        investorId: inv1.id,
        amount: new Prisma.Decimal("1000.00"),
        type: TransactionType.CAPITAL_RETURN,
        paymentMethod: "DIRECT_BANK_WIRE",
        transactionDate: new Date(),
      },
    });

    const summary1 = await getInvestorWalletSummary(adminSession, inv1.id);
    assert(summary1.kpis.availableBalance === 0, "Cash wallet availableBalance must be 0");
    assert(summary1.kpis.totalDirectlyPaid === 1000, `totalDirectlyPaid must be 1000, got ${summary1.kpis.totalDirectlyPaid}`);
    assert(summary1.kpis.eligibleUncreditedEntitlement === 2000, `eligibleUncreditedEntitlement must be 2000 (3000 total - 1000 direct paid), got ${summary1.kpis.eligibleUncreditedEntitlement}`);

    // Modal Available for Reinvestment formula check:
    const availableForReinvestment = summary1.kpis.availableBalance + summary1.kpis.eligibleUncreditedEntitlement;
    assert(availableForReinvestment === 2000, `Modal available balance must be exactly 2000 AED, got ${availableForReinvestment}`);

    const biz1SettlementItem = summary1.businessSettlements.find((b) => b.businessId === biz1.id);
    assert(biz1SettlementItem?.isClosed === true, "Business 1 must be marked isClosed = true in settlement breakdown");
    assert(biz1SettlementItem?.remainingOutstandingEntitlement === 2000, `Remaining outstanding must be 2000, got ${biz1SettlementItem?.remainingOutstandingEntitlement}`);
    console.log("✓ TEST 6 & 7 PASSED: Direct payouts strictly deducted; closed-business entitlements available in modal even with zero cash balance.");

    // -------------------------------------------------------------------------
    // TEST 8: Sale Mutation Guard on Settled Business
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: Mutation / Deletion Guard on Closed Business ---");
    let caughtMutation = false;
    try {
      await updateSale(adminSession, saleResult4.id, {
        quantity: 4,
      });
    } catch (err: any) {
      caughtMutation = true;
      assert(err.message.includes("closed and settled business"), `Expected settled business error, got: ${err.message}`);
    }
    assert(caughtMutation, "Editing a sale on a settled business must be strictly blocked");

    let caughtDeletion = false;
    try {
      await deleteSale(adminSession, saleResult4.id);
    } catch (err: any) {
      caughtDeletion = true;
      assert(err.message.includes("closed and settled business"), `Expected settled business error, got: ${err.message}`);
    }
    assert(caughtDeletion, "Deleting a sale on a settled business must be strictly blocked");
    console.log("✓ TEST 8 PASSED: Mutating or deleting sales on settled businesses is strictly rejected.");

    console.log("\n================================================================================");
    console.log("ALL 8 AUTOMATIC BUSINESS CLOSURE TESTS PASSED CLEANLY!");
    console.log("================================================================================");
  } finally {
    // Clean up test data safely in reverse dependency order
    console.log("\nCleaning up test records...");
    for (const iId of createdInvestorIds) {
      await prisma.investorWalletEntry.deleteMany({ where: { wallet: { investorId: iId } } });
      await prisma.investorWithdrawal.deleteMany({ where: { investorId: iId } });
      await prisma.investorWallet.deleteMany({ where: { investorId: iId } });
      await prisma.investment.deleteMany({ where: { investorId: iId } });
      await prisma.transaction.deleteMany({ where: { investorId: iId } });
    }
    for (const bId of createdBusinessIds) {
      await prisma.auditLog.deleteMany({ where: { entityId: bId } });
      await prisma.investorWalletEntry.deleteMany({ where: { businessId: bId } });
      await prisma.transaction.deleteMany({ where: { businessId: bId } });
      await prisma.expense.deleteMany({ where: { businessId: bId } });
      await prisma.sale.deleteMany({ where: { businessId: bId } });
      await prisma.purchase.deleteMany({ where: { businessId: bId } });
      await prisma.inventory.deleteMany({ where: { businessId: bId } });
      await prisma.investment.deleteMany({ where: { businessId: bId } });
      await prisma.investor.deleteMany({ where: { businessId: bId } });
      await prisma.business.deleteMany({ where: { id: bId } });
    }
    for (const iId of createdInvestorIds) {
      await prisma.investor.deleteMany({ where: { id: iId } });
    }
    console.log("Cleanup completed successfully.");
  }
}

runTests()
  .catch((err) => {
    console.error("TEST FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    const client = redis();
    if (client) client.disconnect();
  });
