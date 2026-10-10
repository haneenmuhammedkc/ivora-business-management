/**
 * Partner and Phone Validation Utilities
 * Lightweight international phone number validator and normalizer.
 */

export const PHONE_MIN_LENGTH = 7;
export const PHONE_MAX_LENGTH = 30;

/**
 * Validates an international phone number.
 * - Optional: returns null if empty or undefined.
 * - Accepts leading '+', digits, spaces, hyphens, parentheses, and dots.
 * - Enforces minimum 7 and maximum 30 characters.
 * - Ensures at least 5 numeric digits are present.
 */
export function validatePhone(phone: unknown): string | null {
  if (phone === undefined || phone === null || phone === "") {
    return null;
  }

  if (typeof phone !== "string") {
    return "Phone number must be a text value.";
  }

  const trimmed = phone.trim();
  if (trimmed === "") {
    return null;
  }

  if (trimmed.length < PHONE_MIN_LENGTH) {
    return `Phone number is too short (minimum ${PHONE_MIN_LENGTH} characters).`;
  }

  if (trimmed.length > PHONE_MAX_LENGTH) {
    return `Phone number cannot exceed ${PHONE_MAX_LENGTH} characters.`;
  }

  // Permitted characters: '+', digits, whitespace, parentheses, hyphens, dots
  if (!/^[+\d\s().-]+$/.test(trimmed)) {
    return "Phone number contains invalid characters.";
  }

  const digits = trimmed.match(/\d/g) || [];
  if (digits.length < 5) {
    return "Phone number must contain at least 5 numeric digits.";
  }

  return null;
}

/**
 * Normalizes phone number: trims whitespace and collapses multiple consecutive spaces into a single space.
 * Returns null if the resulting string is empty.
 */
export function normalizePhone(phone: unknown): string | null {
  if (!phone || typeof phone !== "string") {
    return null;
  }

  const collapsed = phone.trim().replace(/\s+/g, " ");
  return collapsed.length > 0 ? collapsed : null;
}
