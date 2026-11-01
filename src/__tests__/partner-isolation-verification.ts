import { prisma } from "../lib/prisma";
import { listBusinesses } from "../services/business/business.service";
import { listBusinessInvestorRows, getBusinessInvestorDetails } from "../services/investor/investor.service";
import { SessionPayload } from "../lib/auth/session";
import { UserRole } from "@prisma/client";

async function main() {
  console.log("=== RUNNING PARTNER ISOLATION & OPTIONAL PARTNER VERIFICATION ===");

  // 1. Admin Session
  const adminUser = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  const adminSession: SessionPayload = {
    userId: adminUser?.id || "admin-user-id",
    role: UserRole.ADMIN,
    email: adminUser?.email || "admin@ivora.trade",
  };

  // 2. Fetch all businesses via Admin session
  const adminBizList = await listBusinesses(adminSession);
  console.log(`\n1. Admin Businesses Count: ${adminBizList.length}`);
  const tabletsBiz = adminBizList.find((b) => b.name === "TABLETS" || b.code === "B02-DXB-BOM");
  if (!tabletsBiz) {
    throw new Error("TABLETS business not found in admin business list!");
  }
  const tabletsBizTyped = tabletsBiz as typeof tabletsBiz & { displayPartnerName?: string; partner?: { name?: string } };
  console.log(`   - TABLETS partnerId: ${tabletsBiz.partnerId}`);
  console.log(`   - TABLETS displayPartnerName: "${tabletsBizTyped.displayPartnerName || tabletsBizTyped.partner?.name || 'No partner'}"`);

  // 3. Fetch all investors rows via Admin session
  const adminInvRows = await listBusinessInvestorRows(adminSession);
  console.log(`\n2. Admin Investor Business Rows Count: ${adminInvRows.businesses.length}`);
  const tabletsInvRow = adminInvRows.businesses.find((b) => b.name === "TABLETS" || b.code === "B02-DXB-BOM");
  if (!tabletsInvRow) {
    throw new Error("TABLETS not found in admin investor rows!");
  }
  console.log(`   - TABLETS partnerId: ${tabletsInvRow.partnerId}`);
  console.log(`   - TABLETS partnerName: "${tabletsInvRow.partnerName}"`);
  if (tabletsInvRow.partnerName !== "No partner") {
    throw new Error(`Expected partnerName to be "No partner", got "${tabletsInvRow.partnerName}"`);
  }

  // 4. Test Partner User Isolation
  // Find a partner in the system
  const partnerUser = await prisma.user.findFirst({
    where: { role: UserRole.PARTNER },
  });

  if (partnerUser) {
    console.log(`\n3. Testing Partner Isolation for user: ${partnerUser.name} (${partnerUser.email}, id: ${partnerUser.id})`);
    const partnerSession: SessionPayload = {
      userId: partnerUser.id,
      role: UserRole.PARTNER,
      email: partnerUser.email,
    };

    const partnerBizList = await listBusinesses(partnerSession);
    console.log(`   - Partner Biz List Count: ${partnerBizList.length}`);
    for (const b of partnerBizList) {
      if (b.partnerId !== partnerUser.id) {
        throw new Error(`LEAK DETECTED: Partner saw business ${b.name} (${b.id}) with partnerId: ${b.partnerId}`);
      }
      console.log(`   - Allowed Biz: ${b.name} (${b.code}) -> partnerId: ${b.partnerId}`);
    }

    const partnerInvRows = await listBusinessInvestorRows(partnerSession);
    console.log(`   - Partner Investor Rows Count: ${partnerInvRows.businesses.length}`);
    for (const b of partnerInvRows.businesses) {
      if (b.partnerId !== partnerUser.id) {
        throw new Error(`LEAK DETECTED in investor rows: Partner saw business ${b.name} (${b.id}) with partnerId: ${b.partnerId}`);
      }
      console.log(`   - Allowed Investor Row: ${b.name} (${b.code}) -> partnerId: ${b.partnerId}`);
    }

    // Explicit check: TABLETS must NOT be present
    const partnerTablets = partnerBizList.find((b) => b.name === "TABLETS" || b.code === "B02-DXB-BOM");
    if (partnerTablets) {
      throw new Error("LEAK DETECTED: Partner user was able to see unassigned business TABLETS!");
    }
    console.log(`   ✓ Partner correctly CANNOT see unassigned business TABLETS`);
  } else {
    console.log("No PARTNER user found to test partner session isolation.");
  }

  // 5. Test getBusinessInvestorDetails for TABLETS (no partner)
  console.log(`\n4. Testing getBusinessInvestorDetails for TABLETS (${tabletsBiz.id})`);
  const tabletsResult = await getBusinessInvestorDetails(adminSession, tabletsBiz.id);
  const tabletsDetails = tabletsResult.business;
  console.log(`   - Name: ${tabletsDetails.name}`);
  console.log(`   - Partner: ${JSON.stringify(tabletsDetails.partner)}`);
  console.log(`   - Participants Count: ${tabletsDetails.participants.length}`);
  const hasPartnerParticipant = tabletsDetails.participants.some((p) => p.participantType === "PARTNER");
  console.log(`   - Has Partner Participant: ${hasPartnerParticipant}`);
  if (hasPartnerParticipant) {
    throw new Error("TABLETS has no partner but a PARTNER participant was created/found!");
  }

  console.log("\n=== ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ===");
}

main()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
