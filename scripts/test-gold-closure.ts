import { prisma } from '../src/lib/prisma';
import redis from '../src/lib/redis/client';

async function list() {
  const businesses = await prisma.business.findMany({
    select: { id: true, code: true, name: true, status: true, totalInvestmentAED: true, partnerId: true, investments: true }
  });
  console.log('Businesses in DB:', JSON.stringify(businesses, null, 2));
}

list().finally(async () => {
  await prisma.$disconnect();
  const client = redis();
  if (client) client.disconnect();
  process.exit(0);
});
