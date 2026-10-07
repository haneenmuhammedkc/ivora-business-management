/**
 * Auth Validation Constants and Helpers
 * Shared between Client UI and Server API routes.
 */

export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MAX_LENGTH = 128;

// Standard email regex consistent with the project's validation conventions
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface LoginInput {
  email?: unknown;
  password?: unknown;
}

export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export interface ValidatedLoginData {
  email: string;
  password: string;
}

export interface LoginValidationResult {
  isValid: boolean;
  errors: LoginFieldErrors;
  data?: ValidatedLoginData;
}

/**
 * Validates login credentials on both client and server.
 *
 * Rules:
 * - EMAIL:
 *   - Required string
 *   - Trimmed and normalized to lowercase
 *   - Valid format matching standard email pattern
 *   - Max 254 characters (RFC 5321 standard)
 * - PASSWORD:
 *   - Required string
 *   - Max 128 characters
 *   - Preserves all whitespace (no trimming or casing changes)
 *   - Complexity checks are omitted for login
 */
export function validateLoginInput(input: unknown): LoginValidationResult {
  const errors: LoginFieldErrors = {};

  if (!input || typeof input !== "object") {
    return {
      isValid: false,
      errors: {
        email: "Please enter your email address.",
        password: "Please enter your password.",
      },
    };
  }

  const raw = input as Record<string, unknown>;

  // 1. Email Validation
  let normalizedEmail = "";
  if (typeof raw.email !== "string" || !raw.email.trim()) {
    errors.email = "Please enter your email address.";
  } else {
    const trimmedEmail = raw.email.trim();
    if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
      errors.email = "Email address cannot exceed 254 characters.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address (e.g., name@company.com).";
    } else {
      normalizedEmail = trimmedEmail.toLowerCase();
    }
  }

  // 2. Password Validation
  let preservedPassword = "";
  if (typeof raw.password !== "string" || raw.password.length === 0) {
    errors.password = "Please enter your password.";
  } else if (raw.password.length > PASSWORD_MAX_LENGTH) {
    errors.password = "Password cannot exceed 128 characters.";
  } else {
    preservedPassword = raw.password;
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid
      ? {
          email: normalizedEmail,
          password: preservedPassword,
        }
      : undefined,
  };
}
