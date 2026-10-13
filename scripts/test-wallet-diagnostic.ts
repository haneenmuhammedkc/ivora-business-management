import { prisma } from '../src/lib/prisma';
import redis from '../src/lib/redis/client';
import { getInvestorWalletSummary } from '../src/services/investor/wallet.service';
import { getBusinessClosureEligibility } from '../src/services/business/business.service';

async function main() {
  const adminSession = {
    userId: 'cmv536zgp0002s85we4q7n8g5',
    email: 'admin@ivora.ae',
    role: 'ADMIN' as const,
  };

  const investorId = 'cmv536zhm000is85we3ut6ptu'; // Haneen

  console.log('=== 1. Investor Wallet Summary for Haneen (INV-003) ===');
  const summary = await getInvestorWalletSummary(adminSession, investorId);
  console.log('Core KPIs:', {
    availableBalance: summary.kpis.availableBalance,
    eligibleUncreditedEntitlement: summary.kpis.eligibleUncreditedEntitlement,
    totalActiveBusinessEntitlement: summary.kpis.totalActiveBusinessEntitlement,
    totalDirectlyPaid: summary.kpis.totalDirectlyPaid,
    totalReinvested: summary.kpis.totalReinvested,
    totalOutstandingOwedByClosedBusinesses: summary.kpis.totalOutstandingOwedByClosedBusinesses,
  });

  console.log('\n=== 2. Business Settlement Status ===');
  for (const b of summary.businessSettlements) {
    console.log({
      code: b.businessCode,
      name: b.businessName,
      status: b.businessStatus,
      isClosed: b.isClosed,
      committedCapital: b.committedCapital,
      realizedProfit: b.realizedProfitEntitlement,
      totalEntitlement: b.totalEntitlement,
      previouslyPaidDirect: b.previouslyPaidDirect,
      creditedToWallet: b.creditedToWallet,
      remainingOutstanding: b.remainingOutstandingEntitlement,
      settlementState: b.settlementState,
    });
  }

  console.log('\n=== 3. GOLD Business (B01-DXB-BOM) Closure Eligibility ===');
  const goldBiz = await prisma.business.findFirst({ where: { code: 'B01-DXB-BOM' } });
  if (goldBiz) {
    const eligibility = await getBusinessClosureEligibility(adminSession, goldBiz.id);
    console.log({
      businessCode: goldBiz.code,
      status: goldBiz.status,
      isEligible: eligibility.isEligible,
      inventoryRemaining: eligibility.totalUnsoldQuantity,
      reasons: eligibility.reasons,
    });
  }

  console.log('\n=== 4. Recent Double-Entry Ledger Transactions ===');
  for (const e of summary.recentEntries.slice(0, 5)) {
    console.log({
      code: e.entryCode,
      type: e.type,
      category: e.category,
      amount: e.amount,
      balanceAfter: e.balanceAfter,
      desc: e.description,
    });
  }
}

main()
  .catch((err) => {
    console.error('Diagnostic error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
    const client = redis();
    if (client) client.disconnect();
    process.exit(0);
  });
