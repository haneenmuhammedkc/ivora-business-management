import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

const AUTH_COOKIE_NAME = "ivora_access_token";

interface AppJWTPayload extends JWTPayload {
  userId?: string;
  role?: string;
  mustChangePassword?: boolean;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET environment variable is missing in production.");
    }
    return new TextEncoder().encode("ivora-dev-jwt-secret-key-min-32-chars-length!");
  }
  return new TextEncoder().encode(secret);
}

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/businesses",
  "/purchase",
  "/sales",
  "/trading-cycle",
  "/investors",
  "/expenses",
  "/profit-loss",
  "/balance-sheet",
  "/reports",
  "/settings",
  "/profile",
];

const AUTH_PAGES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );

  // If not a protected route or auth page, pass through
  if (!isProtectedRoute && !isAuthPage && pathname !== "/") {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  let sessionPayload: AppJWTPayload | null = null;

  if (token) {
    try {
      const secretKey = getSecretKey();
      const { payload } = await jwtVerify<AppJWTPayload>(token, secretKey, {
        algorithms: ["HS256"],
      });
      if (payload.userId && payload.role) {
        sessionPayload = payload;
      }
    } catch {
      sessionPayload = null;
    }
  }

  const isAuthenticated = Boolean(sessionPayload);

  // If root "/", redirect based on auth status
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Unauthenticated user trying to access protected route
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user with mustChangePassword=true trying to access protected routes
  if (isProtectedRoute && isAuthenticated && sessionPayload?.mustChangePassword) {
    return NextResponse.redirect(new URL("/reset-password", req.url));
  }

  // Authenticated user trying to access auth pages
  if (isAuthPage && isAuthenticated) {
    if (sessionPayload?.mustChangePassword) {
      if (pathname === "/reset-password") {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/reset-password", req.url));
    }

    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
