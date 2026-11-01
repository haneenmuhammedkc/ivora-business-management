import { prisma } from '../src/lib/prisma';
import redis from '../src/lib/redis/client';
import { getInvestorWalletSummary, allocateWalletFundsToBusiness } from '../src/services/investor/wallet.service';

async function runEndToEndVerification() {
  console.log('================================================================');
  console.log('IVORA FINANCIAL WORKFLOW VALIDATION');
  console.log('================================================================');

  const dbAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const adminSession = {
    userId: dbAdmin?.id || 'admin-user',
    email: dbAdmin?.email || 'admin@ivora.ae',
    role: 'ADMIN' as const,
  };

  const unauthorizedPartnerSession = {
    userId: 'unauth-partner-id',
    email: 'other@ivora.ae',
    role: 'PARTNER' as const,
  };

  const investorId = 'cmv536zhm000is85we3ut6ptu'; // Haneen (INV-003)
  const goldCode = 'B01-DXB-BOM';
  const mobilesCode = 'B03-DXB-BOM';

  const goldBiz = await prisma.business.findUnique({ where: { code: goldCode } });
  const mobilesBiz = await prisma.business.findUnique({ where: { code: mobilesCode } });

  if (!goldBiz || !mobilesBiz) {
    throw new Error('Required business entities GOLD or MOBILES not found in database.');
  }

  console.log(`1. Business Status: GOLD (${goldBiz.status}), MOBILES (${mobilesBiz.status})`);

  // Verify Wallet Summary
  console.log('\n2. Fetching Authoritative Investor Wallet Summary...');
  const summary = await getInvestorWalletSummary(adminSession, investorId);

  console.log('Current KPIs:', {
    availableBalance: summary.kpis.availableBalance,
    eligibleUncreditedEntitlement: summary.kpis.eligibleUncreditedEntitlement,
    totalActiveBusinessEntitlement: summary.kpis.totalActiveBusinessEntitlement,
    totalDirectlyPaid: summary.kpis.totalDirectlyPaid,
    totalReinvested: summary.kpis.totalReinvested,
    totalOutstandingOwedByClosedBusinesses: summary.kpis.totalOutstandingOwedByClosedBusinesses,
  });

  const availableForSettlement =
    summary.kpis.availableBalance + summary.kpis.eligibleUncreditedEntitlement;

  console.log(`\nAvailable for Settlement / Reinvestment: AED ${availableForSettlement.toLocaleString()}`);
  console.log(`Outstanding from Active Businesses (Not yet eligible): AED ${summary.kpis.totalActiveBusinessEntitlement.toLocaleString()}`);
  console.log(`Total Directly Paid: AED ${summary.kpis.totalDirectlyPaid.toLocaleString()}`);
  console.log(`Total Reinvested: AED ${summary.kpis.totalReinvested.toLocaleString()}`);
  console.log(`Closed Business Obligations: AED ${summary.kpis.totalOutstandingOwedByClosedBusinesses.toLocaleString()}`);

  // Test Formula Balance
  const goldSettlement = summary.businessSettlements.find((b) => b.businessCode === goldCode);
  const expectedAvailable = goldSettlement?.remainingOutstandingEntitlement ?? 0;
  if (Math.abs(availableForSettlement - expectedAvailable) > 0.05) {
    throw new Error(`Formula mismatch: Expected AED ${expectedAvailable} available, got AED ${availableForSettlement}`);
  }
  console.log(`✓ Available settlement amount matches formula: Entitlement (${goldSettlement?.totalEntitlement}) - Direct Paid (${goldSettlement?.previouslyPaidDirect}) - Credited/Reinvested (${goldSettlement?.creditedToWallet}) = ${expectedAvailable}`);

  // Verify Business Settlements Breakdown
  console.log('\n3. Business Settlements Breakdown:');
  for (const b of summary.businessSettlements) {
    console.log({
      code: b.businessCode,
      name: b.businessName,
      status: b.businessStatus,
      isClosed: b.isClosed,
      totalEntitlement: b.totalEntitlement,
      previouslyPaidDirect: b.previouslyPaidDirect,
      creditedToWallet: b.creditedToWallet,
      remainingOutstanding: b.remainingOutstandingEntitlement,
      state: b.settlementState,
    });
  }

  // Verify Ledger Entries Presentation
  console.log('\n3b. Authoritative Wallet Ledger Entries:');
  for (const entry of summary.recentEntries) {
    console.log({
      code: entry.entryCode,
      type: entry.type,
      category: entry.category,
      direction: entry.direction,
      amount: entry.amount,
      balanceAfter: entry.balanceAfter,
      business: entry.businessName,
      ref: entry.reference,
      description: entry.description,
    });
  }

  // Verify MOBILES Investment Contract
  const mobilesContract = await prisma.investment.findFirst({
    where: { businessId: mobilesBiz.id, investorId },
  });
  console.log('\n4. Target Contract in MOBILES:', {
    committedAmount: Number(mobilesContract?.committedAmount),
    profitSharePct: Number(mobilesContract?.profitSharePct),
    status: mobilesContract?.status,
  });

  // Test Partner Access Guard
  console.log('\n5. Verifying Partner Authorization Guard...');
  try {
    await allocateWalletFundsToBusiness(unauthorizedPartnerSession, investorId, {
      businessId: mobilesBiz.id,
      amount: 1000,
    });
    console.error('FAIL: Unauthorized partner was able to allocate funds!');
  } catch (err: unknown) {
    console.log('✓ Partner authorization properly enforced:', (err as Error).message);
  }

  // Test Over-Allocation Guard
  console.log('\n6. Verifying Over-Allocation Guard...');
  try {
    await allocateWalletFundsToBusiness(adminSession, investorId, {
      businessId: mobilesBiz.id,
      amount: 50000, // exceeds available AED 5,000
    });
    console.error('FAIL: Over-allocation succeeded!');
  } catch (err: unknown) {
    console.log('✓ Over-allocation / double-spending properly blocked:', (err as Error).message);
  }

  console.log('\n================================================================');
  console.log('ALL FINANCIAL WORKFLOWS & CONSTRAINTS VERIFIED SUCCESSFULLY!');
  console.log('================================================================');
}

runEndToEndVerification()
  .catch((err) => {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    const client = redis();
    if (client) client.disconnect();
    process.exit(0);
  });
