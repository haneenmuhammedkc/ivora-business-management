"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface BusinessSummary {
  id: string;
  name: string;
  code: string;
  status: string;
  partnerEquityPct: number | string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: "ADMIN" | "PARTNER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_ACTIVATION";
  mustChangePassword: boolean;
  passwordChangedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  businesses?: BusinessSummary[];
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  requiresActivationOtp?: boolean;
  requiresPasswordChange?: boolean;
  error?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          return data.user;
        }
      }

      setUser(null);
      return null;
    } catch (err) {
      console.error("[AuthContext] Failed to fetch current user session:", err);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    fetch("/api/auth/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isSubscribed) {
          if (data?.success && data?.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        }
      })
      .catch((err) => {
        console.error("[AuthContext] Failed to fetch current user session:", err);
        if (isSubscribed) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({
        success: false,
        error: "Failed to parse server response",
      }));

      if (res.ok && data.success) {
        if (data.user) {
          setUser(data.user);
        }
        return {
          success: true,
          user: data.user,
          requiresActivationOtp: data.requiresActivationOtp ?? false,
          requiresPasswordChange: data.requiresPasswordChange ?? false,
        };
      }

      return {
        success: false,
        error: data.error || "Invalid email or password",
      };
    } catch (err) {
      console.error("[AuthContext] Login request failed:", err);
      return {
        success: false,
        error: "Network error occurred. Please check your connection and try again.",
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    } catch (err) {
      console.error("[AuthContext] Logout request error:", err);
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
