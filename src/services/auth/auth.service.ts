import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth/password";
import { generateOtp, hashOtp, verifyOtpHash, getOtpExpiryDate } from "@/lib/auth/otp";
import { createSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { sendPartnerActivationOtpEmail, sendPasswordResetOtpEmail } from "@/services/email/email.service";
import { AuthTokenType, Prisma, UserRole, UserStatus } from "@prisma/client";

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  passwordChangedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResult {
  success: boolean;
  user?: SafeUser;
  requiresPasswordChange?: boolean;
  requiresActivationOtp?: boolean;
  error?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message?: string;
  error?: string;
  remainingAttempts?: number;
  user?: SafeUser;
  requiresPasswordChange?: boolean;
}

/**
 * Filter sensitive fields from User record.
 */
export function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  passwordChangedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    passwordChangedAt: user.passwordChangedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * User login service.
 */
export async function authenticateUser(params: {
  email: string;
  password: string;
  ipAddress?: string;
}): Promise<LoginResult> {
  const { email, password, ipAddress } = params;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    await logAuditEvent({
      action: "USER_LOGIN_FAILED",
      entity: "User",
      entityId: normalizedEmail,
      oldValues: { reason: "User not found" },
      ipAddress,
    });
    return { success: false, error: "Invalid email or password" };
  }

  if (user.status === UserStatus.SUSPENDED) {
    await logAuditEvent({
      userId: user.id,
      action: "USER_LOGIN_FAILED",
      entity: "User",
      entityId: user.id,
      oldValues: { reason: "Account suspended" },
      ipAddress,
    });
    return { success: false, error: "Account has been suspended. Please contact administrator." };
  }

  if (user.status === UserStatus.INACTIVE) {
    await logAuditEvent({
      userId: user.id,
      action: "USER_LOGIN_FAILED",
      entity: "User",
      entityId: user.id,
      oldValues: { reason: "Account inactive" },
      ipAddress,
    });
    return { success: false, error: "Account is inactive." };
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    await logAuditEvent({
      userId: user.id,
      action: "USER_LOGIN_FAILED",
      entity: "User",
      entityId: user.id,
      oldValues: { reason: "Invalid password" },
      ipAddress,
    });
    return { success: false, error: "Invalid email or password" };
  }

  // Account is PENDING_ACTIVATION or PARTNER first login requiring OTP verification
  if (user.status === UserStatus.PENDING_ACTIVATION || (user.role === UserRole.PARTNER && user.mustChangePassword)) {
    // Generate new activation OTP and send to partner
    const otp = generateOtp();
    const tokenHash = hashOtp(otp);
    const expiresAt = getOtpExpiryDate(10);

    await prisma.authToken.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        type: AuthTokenType.ACCOUNT_ACTIVATION,
        expiresAt,
      },
    });

    await sendPartnerActivationOtpEmail({
      email: normalizedEmail,
      name: user.name,
      otp,
    });

    return {
      success: true,
      user: sanitizeUser(user),
      requiresActivationOtp: true,
      requiresPasswordChange: true,
    };
  }

  // Account requires mandatory password change (first-login after activation)
  if (user.mustChangePassword) {
    // Issue a session token restricted with mustChangePassword flag
    const token = await createSessionToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      mustChangePassword: true,
    });
    await setSessionCookie(token);

    return {
      success: true,
      user: sanitizeUser(user),
      requiresPasswordChange: true,
    };
  }

  // Normal Successful Login
  const token = await createSessionToken({
    userId: user.id,
    role: user.role,
    email: user.email,
    mustChangePassword: false,
  });
  await setSessionCookie(token);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await logAuditEvent({
    userId: user.id,
    action: "USER_LOGIN",
    entity: "User",
    entityId: user.id,
    ipAddress,
  });

  return {
    success: true,
    user: sanitizeUser(user),
  };
}

/**
 * Verify OTP for activation or password reset.
 */
export async function verifyOtpToken(params: {
  email: string;
  otp: string;
  type: AuthTokenType;
  ipAddress?: string;
}): Promise<VerifyOtpResult> {
  const { email, otp, type, ipAddress } = params;

  if (!email || !otp) {
    return { success: false, error: "Email and verification code are required" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  // Find the latest active unconsumed token for this email and type
  const authToken = await prisma.authToken.findFirst({
    where: {
      email: normalizedEmail,
      type,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!authToken) {
    return {
      success: false,
      error: "Verification code is invalid or has expired. Please request a new code.",
    };
  }

  if (authToken.attempts >= authToken.maxAttempts) {
    return {
      success: false,
      error: "Maximum verification attempts exceeded. Please request a new code.",
    };
  }

  const isMatch = verifyOtpHash(cleanOtp, authToken.tokenHash);

  if (!isMatch) {
    const updated = await prisma.authToken.update({
      where: { id: authToken.id },
      data: { attempts: { increment: 1 } },
    });

    const remaining = Math.max(0, updated.maxAttempts - updated.attempts);

    await logAuditEvent({
      action: "OTP_VERIFICATION_FAILED",
      entity: "AuthToken",
      entityId: authToken.id,
      oldValues: { email: normalizedEmail, type, attempts: updated.attempts },
      ipAddress,
    });

    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      remainingAttempts: remaining,
    };
  }

  // Token is valid! Consume token and update user state if activation
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.authToken.update({
      where: { id: authToken.id },
      data: { consumedAt: new Date() },
    });

    if (type === AuthTokenType.ACCOUNT_ACTIVATION) {
      await tx.user.updateMany({
        where: { email: normalizedEmail, status: UserStatus.PENDING_ACTIVATION },
        data: { status: UserStatus.ACTIVE },
      });
    }
  });

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (user) {
    if (type === AuthTokenType.ACCOUNT_ACTIVATION) {
      // Issue restricted session token with mustChangePassword flag so partner can directly set new password
      const token = await createSessionToken({
        userId: user.id,
        role: user.role,
        email: user.email,
        mustChangePassword: user.mustChangePassword,
      });
      await setSessionCookie(token);
    }

    await logAuditEvent({
      userId: user.id,
      action: type === AuthTokenType.ACCOUNT_ACTIVATION ? "EMAIL_VERIFIED" : "OTP_VERIFIED",
      entity: "User",
      entityId: user.id,
      ipAddress,
    });
  }

  return {
    success: true,
    message: "Verification successful.",
    user: user ? sanitizeUser(user) : undefined,
    requiresPasswordChange: user ? user.mustChangePassword : false,
  };
}

/**
 * Change password (authenticated user or first-login forced rotation).
 */
export async function changeUserPassword(params: {
  userId: string;
  currentPassword?: string;
  newPassword: string;
  ipAddress?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { userId, currentPassword, newPassword, ipAddress } = params;

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    return { success: false, error: strength.error };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  // If user does not have mandatory change required, require current password verification
  if (!user.mustChangePassword) {
    if (!currentPassword) {
      return { success: false, error: "Current password is required" };
    }
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return { success: false, error: "Current password is incorrect" };
    }
  }

  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      status: user.status === UserStatus.PENDING_ACTIVATION ? UserStatus.ACTIVE : user.status,
    },
  });

  // Re-issue full active session token
  const updatedSessionToken = await createSessionToken({
    userId: user.id,
    role: user.role,
    email: user.email,
    mustChangePassword: false,
  });
  await setSessionCookie(updatedSessionToken);

  await logAuditEvent({
    userId: user.id,
    action: "PASSWORD_CHANGED",
    entity: "User",
    entityId: user.id,
    ipAddress,
  });

  return { success: true };
}

/**
 * Initiate forgot password flow.
 */
export async function requestPasswordReset(params: {
  email: string;
  ipAddress?: string;
}): Promise<{ success: boolean; message: string }> {
  const { email, ipAddress } = params;
  const genericMessage = "If an account matches that email, password reset instructions have been sent.";

  if (!email) {
    return { success: true, message: genericMessage };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.status === UserStatus.SUSPENDED) {
    // Avoid user enumeration
    return { success: true, message: genericMessage };
  }

  const otp = generateOtp();
  const tokenHash = hashOtp(otp);
  const expiresAt = getOtpExpiryDate(10);

  await prisma.authToken.create({
    data: {
      email: normalizedEmail,
      tokenHash,
      type: AuthTokenType.PASSWORD_RESET,
      expiresAt,
    },
  });

  await sendPasswordResetOtpEmail({
    email: normalizedEmail,
    name: user.name,
    otp,
  });

  await logAuditEvent({
    userId: user.id,
    action: "PASSWORD_RESET_REQUESTED",
    entity: "User",
    entityId: user.id,
    ipAddress,
  });

  return { success: true, message: genericMessage };
}

/**
 * Reset password using OTP code.
 */
export async function resetPasswordWithOtp(params: {
  email: string;
  otp: string;
  newPassword: string;
  ipAddress?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { email, otp, newPassword, ipAddress } = params;

  if (!email || !otp || !newPassword) {
    return { success: false, error: "Email, verification code, and new password are required" };
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    return { success: false, error: strength.error };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  const authToken = await prisma.authToken.findFirst({
    where: {
      email: normalizedEmail,
      type: AuthTokenType.PASSWORD_RESET,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!authToken) {
    return { success: false, error: "Invalid or expired password reset code." };
  }

  if (authToken.attempts >= authToken.maxAttempts) {
    return { success: false, error: "Maximum verification attempts exceeded. Please request a new code." };
  }

  const isMatch = verifyOtpHash(cleanOtp, authToken.tokenHash);

  if (!isMatch) {
    const updated = await prisma.authToken.update({
      where: { id: authToken.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = Math.max(0, updated.maxAttempts - updated.attempts);
    return {
      success: false,
      error: `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  const newHash = await hashPassword(newPassword);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return { success: false, error: "User account not found" };
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.authToken.update({
      where: { id: authToken.id },
      data: { consumedAt: new Date() },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
        status: user.status === UserStatus.PENDING_ACTIVATION ? UserStatus.ACTIVE : user.status,
      },
    });
  });

  await logAuditEvent({
    userId: user.id,
    action: "PASSWORD_RESET",
    entity: "User",
    entityId: user.id,
    ipAddress,
  });

  return { success: true };
}

/**
 * Logout user by clearing session cookie.
 */
export async function logoutUser(userId?: string, ipAddress?: string): Promise<void> {
  await clearSessionCookie();

  if (userId) {
    await logAuditEvent({
      userId,
      action: "USER_LOGOUT",
      entity: "User",
      entityId: userId,
      ipAddress,
    });
  }
}
