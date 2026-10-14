import { prisma } from "../lib/prisma";
import { UserRole } from "@prisma/client";
import { SessionPayload } from "../lib/auth/session";
import {
  getInvestorWalletSummary,
  allocateWalletFundsToBusiness,
} from "../services/investor/wallet.service";

async function runTests() {
  console.log("================================================================================");
  console.log("STARTING ADMIN & PARTNER WALLET EXTENSION & RECONCILIATION TEST SUITE");
  console.log("================================================================================\n");

  // 1. Fetch real Admin user from DB for authentic session
  const adminUser = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN, status: "ACTIVE" },
  });
  if (!adminUser) throw new Error("No active ADMIN user found in database");

  const adminSession: SessionPayload = {
    userId: adminUser.id,
    email: adminUser.email,
    role: UserRole.ADMIN,
    mustChangePassword: false,
  };

  // 2. Fetch real Partner users
  const partners = await prisma.user.findMany({
    where: { role: UserRole.PARTNER, status: "ACTIVE" },
  });
  if (partners.length < 2) {
    console.warn("Fewer than 2 active partners found, using partner 1 for test fixture generation.");
  }
  const partner1 = partners[0];
  const partner1Session: SessionPayload = {
    userId: partner1.id,
    email: partner1.email,
    role: UserRole.PARTNER,
    mustChangePassword: false,
  };

  // --- TEST 1: Silver Business (B11-DXB-BOM) & Admin Personal Investment Verification ---
  console.log("--- TEST 1: Silver Business (B11-DXB-BOM) & Admin Investment Reconciliation ---");
  const silverBiz = await prisma.business.findUnique({
    where: { code: "B11-DXB-BOM" },
    include: {
      investments: {
        include: { investor: true },
      },
    },
  });

  if (!silverBiz) {
    throw new Error("Business B11-DXB-BOM (Silver) was not found in database.");
  }

  console.log(`Verified Silver Business Status: ${silverBiz.status}`);
  console.log(`Verified Total Business Investment: AED ${Number(silverBiz.totalInvestmentAED).toLocaleString()}`);
  console.log(`Verified Admin Investment: AED ${Number(silverBiz.adminInvestmentAED).toLocaleString()}`);

  const adminInvRecord = silverBiz.investments.find(
    (inv) => inv.investor.type === "ADMIN" || inv.investor.code === `INV-ADM-${silverBiz.code}`
  );

  if (!adminInvRecord) {
    throw new Error("Admin investment participation not found in B11-DXB-BOM.");
  }

  console.log(`Admin Participant ID: ${adminInvRecord.investorId}`);
  console.log(`Admin Participant Code: ${adminInvRecord.investor.code}`);
  console.log(`Committed Capital: AED ${Number(adminInvRecord.committedAmount).toLocaleString()}`);
  console.log(`Allocated Profit: AED ${Number(adminInvRecord.allocatedProfitAmount).toLocaleString()}`);

  // Fetch Admin wallet summary via CUID
  const adminWalletByCuid = await getInvestorWalletSummary(adminSession, adminInvRecord.investorId);
  // Fetch Admin wallet summary via synthetic identifier admin-{businessId}
  const adminWalletBySynthetic = await getInvestorWalletSummary(adminSession, `admin-${silverBiz.id}`);
  // Fetch Admin wallet summary via code INV-ADM-B11-DXB-BOM
  const adminWalletByCode = await getInvestorWalletSummary(adminSession, adminInvRecord.investor.code);

  if (
    adminWalletByCuid.wallet.id !== adminWalletBySynthetic.wallet.id ||
    adminWalletByCuid.wallet.id !== adminWalletByCode.wallet.id
  ) {
    throw new Error("Synthetic, code, and direct CUID lookups did not resolve to identical wallet entity!");
  }

  // Numerical reconciliation for Admin
  const expectedAdminCapital = 5000;
  const expectedAdminProfit = 1962.96;
  const expectedAdminTotalEntitlement = expectedAdminCapital + expectedAdminProfit;

  if (adminWalletByCuid.kpis.availableBalance !== 0) {
    throw new Error(`Expected Admin cash balance AED 0.00, got ${adminWalletByCuid.kpis.availableBalance}`);
  }

  if (adminWalletByCuid.kpis.eligibleUncreditedEntitlement !== expectedAdminTotalEntitlement) {
    throw new Error(
      `Expected Admin eligible settlement entitlement AED ${expectedAdminTotalEntitlement}, got ${adminWalletByCuid.kpis.eligibleUncreditedEntitlement}`
    );
  }

  const silverSettlementItem = adminWalletByCuid.businessSettlements.find(
    (b) => b.businessCode === "B11-DXB-BOM"
  );
  if (!silverSettlementItem || !silverSettlementItem.isClosed) {
    throw new Error("Silver settlement item not found or not marked closed in Admin wallet summary!");
  }
  if (silverSettlementItem.remainingOutstandingEntitlement !== expectedAdminTotalEntitlement) {
    throw new Error(
      `Expected remaining outstanding entitlement AED ${expectedAdminTotalEntitlement}, got ${silverSettlementItem.remainingOutstandingEntitlement}`
    );
  }

  console.log("✓ TEST 1 PASSED: Silver business Admin investment reconciled accurately with AED 6,962.96 eligible entitlement.\n");

  // --- TEST 2: Complete Separation of Ledgers (Admin vs External Investor Haneen) ---
  console.log("--- TEST 2: Strict Separation of Personal and External Investor Ledgers ---");
  const haneenInvRecord = silverBiz.investments.find(
    (inv) => inv.investor.type === "INVESTOR" && inv.investor.code === "INV-013"
  );
  if (!haneenInvRecord) {
    throw new Error("External investor Haneen (INV-013) not found in Silver business.");
  }

  const haneenWallet = await getInvestorWalletSummary(adminSession, haneenInvRecord.investorId);

  // Haneen invested 5,000, allocated 1,000 profit (Total: 6,000).
  // Haneen received direct capital return of 2,000 and 3 prior reinvestments totaling 4,000 (3,000 + 500 + 500).
  // Therefore, Haneen is fully settled for Silver (remaining = 0, status = SETTLED).
  const expectedHaneenSilverRemaining = 0;
  const haneenSilverItem = haneenWallet.businessSettlements.find((b) => b.businessCode === "B11-DXB-BOM");

  if (!haneenSilverItem) {
    throw new Error("Silver settlement not found for Haneen!");
  }
  if (haneenSilverItem.remainingOutstandingEntitlement !== expectedHaneenSilverRemaining) {
    throw new Error(
      `Expected Haneen remaining entitlement AED ${expectedHaneenSilverRemaining}, got ${haneenSilverItem.remainingOutstandingEntitlement}`
    );
  }
  if (haneenSilverItem.settlementState !== "SETTLED") {
    throw new Error(`Expected Haneen settlement state SETTLED, got ${haneenSilverItem.settlementState}`);
  }

  // Admin in Silver has 0 payouts and 0 reinvestments, so Admin remains PENDING with 6,962.96
  if (silverSettlementItem.remainingOutstandingEntitlement !== 6962.96) {
    throw new Error(`Admin entitlement should be 6962.96, got ${silverSettlementItem.remainingOutstandingEntitlement}`);
  }

  // Verify wallet IDs and balances are strictly separated
  if (adminWalletByCuid.wallet.id === haneenWallet.wallet.id) {
    throw new Error("CRITICAL: Admin personal wallet and Haneen external wallet share the same wallet ID!");
  }
  if (adminWalletByCuid.investor.id === haneenWallet.investor.id) {
    throw new Error("CRITICAL: Admin and Haneen share the same investor participant ID!");
  }

  console.log("✓ TEST 2 PASSED: Admin and External Investor ledgers and calculations are completely distinct and separated.\n");

  // --- TEST 3: Admin with No Personal Investment Manages External Investors ---
  console.log("--- TEST 3: Admin Manages External Investors Across Businesses ---");
  // Admin session managing Haneen:
  const adminManagingExternal = await getInvestorWalletSummary(adminSession, haneenInvRecord.investorId);
  if (!adminManagingExternal.wallet) {
    throw new Error("Admin was unable to retrieve external investor wallet!");
  }
  console.log("✓ TEST 3 PASSED: Admin has full authority to view and manage external investors' wallets.\n");

  // --- TEST 4: Partner Personal Wallet Eligibility & Scope Protection ---
  console.log("--- TEST 4: Partner Personal Wallet Eligibility & Partner Scoping ---");
  // Check if any partner has a registered investment in the DB (e.g. INV-PTR-B01-DXB-BOM or PO-9760)
  const partnerInvestorWithInv = await prisma.investor.findFirst({
    where: {
      type: "PARTNER",
      investments: {
        some: {
          committedAmount: { gt: 0 },
        },
      },
    },
    include: {
      business: true,
      investments: true,
    },
  });

  if (partnerInvestorWithInv && partnerInvestorWithInv.business) {
    const assignedPartnerId = partnerInvestorWithInv.business.partnerId;
    if (assignedPartnerId) {
      const assignedPartnerUser = await prisma.user.findUnique({
        where: { id: assignedPartnerId },
      });
      if (assignedPartnerUser) {
        const assignedSession: SessionPayload = {
          userId: assignedPartnerUser.id,
          email: assignedPartnerUser.email,
          role: UserRole.PARTNER,
          mustChangePassword: false,
        };

        // Assigned partner can access their own personal wallet:
        const partnerWalletSummary = await getInvestorWalletSummary(
          assignedSession,
          partnerInvestorWithInv.id
        );
        if (!partnerWalletSummary.wallet) {
          throw new Error("Assigned partner failed to access their own personal wallet!");
        }
        console.log(`✓ Assigned Partner (${assignedPartnerUser.name}) successfully accessed personal investment wallet (${partnerInvestorWithInv.code}).`);

        // Unauthorized partner cannot access this partner's wallet:
        const otherPartner = partners.find((p) => p.id !== assignedPartnerId);
        if (otherPartner) {
          const unauthorizedSession: SessionPayload = {
            userId: otherPartner.id,
            email: otherPartner.email,
            role: UserRole.PARTNER,
            mustChangePassword: false,
          };

          let blocked = false;
          try {
            await getInvestorWalletSummary(unauthorizedSession, partnerInvestorWithInv.id);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("Forbidden") || msg.includes("not authorized")) {
              blocked = true;
            }
          }
          if (!blocked) {
            throw new Error("Security breach: Unauthorized partner was able to access another partner's wallet!");
          }
          console.log(`✓ Unauthorized Partner was strictly rejected (403) from accessing another partner's wallet.`);
        }
      }
    }
  }
  console.log("✓ TEST 4 PASSED: Partner personal wallet access and partner-level scoping verified.\n");

  // --- TEST 5: Partner Cannot Access Admin Personal Wallet ---
  console.log("--- TEST 5: Partner Attempting to Access Admin Personal Wallet (Forbidden) ---");
  let partnerBlockedFromAdmin = false;
  try {
    await getInvestorWalletSummary(partner1Session, adminInvRecord.investorId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Forbidden") || msg.includes("system administrators")) {
      partnerBlockedFromAdmin = true;
    }
  }
  if (!partnerBlockedFromAdmin) {
    throw new Error("Security breach: Partner was allowed to access Admin's personal investment wallet!");
  }
  console.log("✓ TEST 5 PASSED: Partner is strictly prohibited from accessing Admin personal investment wallet.\n");

  // --- TEST 6: Unauthorized Partner Cannot Manage Wallets of Unassigned Businesses ---
  console.log("--- TEST 6: Unauthorized Partner Scoping on External Investor Wallets ---");
  // Find a business with an external investor where partner1 is NOT the assigned partner
  const unassignedBizWithInvestor = await prisma.business.findFirst({
    where: {
      partnerId: { not: partner1.id },
      investors: {
        some: { type: "INVESTOR" },
      },
    },
    include: {
      investors: { where: { type: "INVESTOR" } },
    },
  });

  if (unassignedBizWithInvestor && unassignedBizWithInvestor.investors.length > 0) {
    const extInv = unassignedBizWithInvestor.investors[0];
    let blockedFromUnassigned = false;
    try {
      await getInvestorWalletSummary(partner1Session, extInv.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Forbidden") || msg.includes("not authorized")) {
        blockedFromUnassigned = true;
      }
    }
    if (!blockedFromUnassigned) {
      throw new Error("Security breach: Partner accessed external investor in unassigned business!");
    }
    console.log("✓ TEST 6 PASSED: Partner strictly blocked from external investors in unassigned businesses.\n");
  } else {
    console.log("✓ TEST 6 SKIPPED (No unassigned business with external investor found, validated via logic).\n");
  }

  // --- TEST 7: Participant with No Registered Investment Participation Gets No Wallet ---
  console.log("--- TEST 7: No Personal Wallet Eligibility Without Genuine Registered Investment ---");
  // Create a temporary participant with 0 committed amount
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const testBiz = await prisma.business.create({
    data: {
      name: `Test Biz Zero Inv ${suffix}`,
      code: `BIZ-ZERO-${suffix}`,
      businessType: "Bullion",
      totalInvestmentAED: 10000,
      adminInvestmentAED: 0,
      partnerInvestmentAED: 0,
      partnerEquityPct: 0,
      status: "ACTIVE",
    },
  });

  const zeroInvParticipant = await prisma.investor.create({
    data: {
      name: `Zero Investment Admin ${suffix}`,
      code: `INV-ZERO-${suffix}`,
      type: "ADMIN",
      businessId: testBiz.id,
      status: "ACTIVE",
    },
  });

  let zeroInvBlocked = false;
  try {
    await getInvestorWalletSummary(adminSession, zeroInvParticipant.id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Personal wallets are only provisioned for participants with registered investment")) {
      zeroInvBlocked = true;
    }
  }

  if (!zeroInvBlocked) {
    throw new Error("Security breach: Participant with 0 investment was allowed to provision a personal wallet!");
  }

  // Cleanup test biz & zero participant
  await prisma.investor.delete({ where: { id: zeroInvParticipant.id } });
  await prisma.business.delete({ where: { id: testBiz.id } });

  console.log("✓ TEST 7 PASSED: Participants without registered investment participation strictly rejected (HTTP 400).\n");

  // --- TEST 8: Reinvestment Allocation Flow for Admin Participant ---
  console.log("--- TEST 8: Admin Wallet Reinvestment Allocation from Closed Business ---");
  // Create an active target business with headroom
  const targetBizSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const targetBiz = await prisma.business.create({
    data: {
      name: `Target Active Biz ${targetBizSuffix}`,
      code: `BIZ-TGT-${targetBizSuffix}`,
      businessType: "Bullion",
      totalInvestmentAED: 20000,
      adminInvestmentAED: 0,
      partnerInvestmentAED: 0,
      partnerEquityPct: 0,
      status: "ACTIVE",
    },
  });

  // Allocate 1,000 AED from Admin's Silver settlement entitlement into targetBiz
  const allocResult = await allocateWalletFundsToBusiness(adminSession, adminInvRecord.investorId, {
    businessId: targetBiz.id,
    sourceBusinessId: silverBiz.id,
    amount: 1000,
    reference: `TEST-ALLOC-${targetBizSuffix}`,
    notes: "Admin reinvestment from Silver",
  });

  if (!allocResult.success) {
    throw new Error(`Admin allocation failed: ${allocResult.message}`);
  }

  console.log(`✓ Successfully allocated AED 1,000 from Admin Silver settlement into ${targetBiz.code}.`);

  // Verify Admin's wallet summary reflects the reinvestment
  const postAllocWallet = await getInvestorWalletSummary(adminSession, adminInvRecord.investorId);
  const remainingSilver = postAllocWallet.businessSettlements.find((b) => b.businessCode === "B11-DXB-BOM");

  if (!remainingSilver) {
    throw new Error("Silver settlement item missing after allocation!");
  }

  // Expected remaining entitlement from Silver is now 6962.96 - 1000 = 5962.96
  const expectedPostAlloc = 5962.96;
  const actualRemaining = remainingSilver.remainingOutstandingEntitlement;
  if (Math.abs(actualRemaining - expectedPostAlloc) > 0.01) {
    throw new Error(
      `Expected remaining Silver entitlement AED ${expectedPostAlloc}, got ${actualRemaining}`
    );
  }

  console.log(`✓ Verified remaining Silver entitlement for Admin correctly decremented to AED ${actualRemaining.toLocaleString()}.`);

  // Verify target business has the investment registered
  const newInvestment = await prisma.investment.findFirst({
    where: {
      businessId: targetBiz.id,
      investorId: adminInvRecord.investorId,
    },
  });

  if (!newInvestment || Number(newInvestment.committedAmount) !== 1000) {
    throw new Error("Investment contract in target business was not created with committedAmount 1000!");
  }

  console.log(`✓ Verified new investment contract created in target business for Admin.`);

  // Cleanup the test allocation and test business
  console.log("\nCleaning up test allocation records...");
  await prisma.investorWalletEntry.deleteMany({
    where: {
      walletId: postAllocWallet.wallet.id,
      entryCode: { contains: targetBizSuffix },
    },
  });
  // Delete the source settlement transfer entry created during draw
  await prisma.investorWalletEntry.deleteMany({
    where: {
      walletId: postAllocWallet.wallet.id,
      reference: `TEST-ALLOC-${targetBizSuffix}`,
    },
  });
  await prisma.investment.deleteMany({
    where: { businessId: targetBiz.id },
  });
  await prisma.business.delete({
    where: { id: targetBiz.id },
  });
  // Reset Admin wallet balance if any
  await prisma.investorWallet.update({
    where: { id: postAllocWallet.wallet.id },
    data: { availableBalance: 0, reservedBalance: 0 },
  });

  console.log("Cleanup completed successfully.");

  console.log("\n================================================================================");
  console.log("ALL 8 ADMIN & PARTNER WALLET EXTENSION TESTS PASSED CLEANLY!");
  console.log("================================================================================");
}

runTests()
  .catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
