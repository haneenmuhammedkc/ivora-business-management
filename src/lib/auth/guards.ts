import { NextResponse } from "next/server";
import { getSession, SessionPayload } from "./session";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Standard API error response generator.
 */
export function errorResponse(message: string, status = 400, details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export function unauthorizedResponse(message = "Authentication required") {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = "Access forbidden") {
  return errorResponse(message, 403);
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      success: false,
      error: "Too many requests. Please try again later.",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
      },
    }
  );
}

/**
 * Ensure user is authenticated. Returns session payload or throws AuthError(401).
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized: Session is missing or invalid", 401);
  }
  return session;
}

/**
 * Ensure user is authenticated and has the ADMIN role.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== UserRole.ADMIN) {
    throw new AuthError("Forbidden: Admin privileges required", 403);
  }
  return session;
}

/**
 * Ensure user is authenticated and has the PARTNER role.
 */
export async function requirePartner(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== UserRole.PARTNER) {
    throw new AuthError("Forbidden: Partner access required", 403);
  }
  return session;
}

/**
 * Fetch full active user entity from database without passwordHash.
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
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
      businesses: {
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          partnerEquityPct: true,
        },
      },
    },
  });

  if (!user || user.status === UserStatus.SUSPENDED || user.status === UserStatus.INACTIVE) {
    return null;
  }

  return user;
}
