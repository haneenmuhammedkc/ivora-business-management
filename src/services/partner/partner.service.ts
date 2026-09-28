import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { generateOtp, hashOtp, getOtpExpiryDate } from "@/lib/auth/otp";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { sendPartnerActivationOtpEmail } from "@/services/email/email.service";
import { sanitizeUser, SafeUser } from "@/services/auth/auth.service";
import { AuthTokenType, Prisma, UserRole, UserStatus } from "@prisma/client";

export interface CreatePartnerInput {
  adminUserId: string;
  name: string;
  email: string;
  temporaryPassword?: string;
  businessId?: string;
  partnerEquityPct?: number;
  ipAddress?: string;
}

export interface CreatePartnerResult {
  success: boolean;
  partner?: SafeUser & { assignedBusinessId?: string };
  temporaryPassword?: string;
  error?: string;
}

/**
 * Generate a random secure temporary password.
 */
function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let pwd = "Iv1!";
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

/**
 * Admin service to create and onboard a new Partner account.
 */
export async function createPartnerUser(input: CreatePartnerInput): Promise<CreatePartnerResult> {
  const { adminUserId, name, email, businessId, partnerEquityPct, ipAddress } = input;

  if (!name || !email) {
    return { success: false, error: "Partner name and email are required" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Verify email uniqueness
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return { success: false, error: "A user account with this email already exists" };
  }

  const rawTemporaryPassword = input.temporaryPassword?.trim() || generateTemporaryPassword();
  const strength = validatePasswordStrength(rawTemporaryPassword);
  if (!strength.valid) {
    return { success: false, error: `Temporary password invalid: ${strength.error}` };
  }

  // If businessId is provided, verify business exists
  if (businessId) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      return { success: false, error: `Assigned business with ID ${businessId} not found` };
    }
  }

  const passwordHash = await hashPassword(rawTemporaryPassword);
  const otp = generateOtp();
  const tokenHash = hashOtp(otp);
  const otpExpiry = getOtpExpiryDate(10);

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Create Partner user
    const newPartner = await tx.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        role: UserRole.PARTNER,
        status: UserStatus.PENDING_ACTIVATION,
        mustChangePassword: true,
      },
    });

    // 2. Create Activation OTP token
    await tx.authToken.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        type: AuthTokenType.ACCOUNT_ACTIVATION,
        expiresAt: otpExpiry,
      },
    });

    // 3. Link to business if specified
    if (businessId) {
      await tx.business.update({
        where: { id: businessId },
        data: {
          partnerId: newPartner.id,
          ...(partnerEquityPct !== undefined ? { partnerEquityPct } : {}),
        },
      });
    }

    return newPartner;
  });

  // 4. Send Brevo invitation / activation email
  await sendPartnerActivationOtpEmail({
    email: normalizedEmail,
    name: name.trim(),
    otp,
    temporaryPassword: rawTemporaryPassword,
  });

  // 5. Audit Log
  await logAuditEvent({
    userId: adminUserId,
    action: "PARTNER_CREATED",
    entity: "User",
    entityId: result.id,
    newValues: {
      email: normalizedEmail,
      name: name.trim(),
      role: UserRole.PARTNER,
      assignedBusinessId: businessId || null,
    },
    ipAddress,
  });

  return {
    success: true,
    partner: {
      ...sanitizeUser(result),
      assignedBusinessId: businessId,
    },
    temporaryPassword: rawTemporaryPassword,
  };
}

/**
 * List all Partners for Admin view.
 */
export async function listPartners() {
  const partners = await prisma.user.findMany({
    where: { role: UserRole.PARTNER },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      businesses: {
        select: {
          id: true,
          name: true,
          code: true,
          partnerEquityPct: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return partners;
}

/**
 * Get Partner details by ID.
 */
export async function getPartnerById(partnerId: string) {
  const partner = await prisma.user.findFirst({
    where: { id: partnerId, role: UserRole.PARTNER },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      businesses: {
        select: {
          id: true,
          name: true,
          code: true,
          partnerEquityPct: true,
          status: true,
        },
      },
    },
  });

  return partner;
}

/**
 * Update Partner profile details (name and phone).
 */
export async function updatePartnerProfile(params: {
  adminUserId: string;
  partnerId: string;
  name: string;
  phone: string;
  ipAddress?: string;
}): Promise<{ success: boolean; partner?: SafeUser & { phone?: string | null }; error?: string }> {
  const { adminUserId, partnerId, name, phone, ipAddress } = params;

  const partner = await prisma.user.findFirst({
    where: { id: partnerId, role: UserRole.PARTNER },
  });

  if (!partner) {
    return { success: false, error: "Partner account not found" };
  }

  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanPhone = typeof phone === "string" ? phone.trim() : "";

  if (!cleanName) {
    return { success: false, error: "Partner name is required" };
  }

  if (!cleanPhone) {
    return { success: false, error: "Partner phone number is required" };
  }

  const oldValues = {
    name: partner.name,
    phone: partner.phone,
  };

  const updatedPartner = await prisma.user.update({
    where: { id: partnerId },
    data: {
      name: cleanName,
      phone: cleanPhone,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      mustChangePassword: true,
      passwordChangedAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: "PARTNER_PROFILE_UPDATED",
    entity: "User",
    entityId: partnerId,
    oldValues,
    newValues: {
      name: cleanName,
      phone: cleanPhone,
    },
    ipAddress,
  });

  return {
    success: true,
    partner: updatedPartner,
  };
}

/**
 * Update Partner account status (ACTIVE, INACTIVE, SUSPENDED).
 */
export async function updatePartnerStatus(params: {
  adminUserId: string;
  partnerId: string;
  status: UserStatus;
  ipAddress?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { adminUserId, partnerId, status, ipAddress } = params;

  const partner = await prisma.user.findFirst({
    where: { id: partnerId, role: UserRole.PARTNER },
  });

  if (!partner) {
    return { success: false, error: "Partner account not found" };
  }

  // Prevent manually activating a partner whose status is PENDING_ACTIVATION without completing email OTP verification
  if (partner.status === UserStatus.PENDING_ACTIVATION && status === UserStatus.ACTIVE) {
    return {
      success: false,
      error: "Cannot activate partner account while pending verification. Partner must complete account activation via OTP.",
    };
  }

  // Allowed target statuses for partner management
  const allowedStatuses: UserStatus[] = [
    UserStatus.ACTIVE,
    UserStatus.INACTIVE,
    UserStatus.SUSPENDED,
  ];

  if (!allowedStatuses.includes(status)) {
    return {
      success: false,
      error: `Invalid status for partner. Allowed statuses: ${allowedStatuses.join(", ")}`,
    };
  }

  // If status is unchanged, return success directly
  if (partner.status === status) {
    return { success: true };
  }

  await prisma.user.update({
    where: { id: partnerId },
    data: { status },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: "PARTNER_STATUS_CHANGED",
    entity: "User",
    entityId: partnerId,
    oldValues: { status: partner.status },
    newValues: { status },
    ipAddress,
  });

  return { success: true };
}
