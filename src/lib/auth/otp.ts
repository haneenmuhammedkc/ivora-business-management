import crypto from "node:crypto";

const OTP_LENGTH = 6;
const OTP_EXPIRATION_MINUTES = 10;
export const MAX_OTP_ATTEMPTS = 5;

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 */
export function generateOtp(): string {
  const min = Math.pow(10, OTP_LENGTH - 1); // 100000
  const max = Math.pow(10, OTP_LENGTH) - 1; // 999999
  return crypto.randomInt(min, max + 1).toString();
}

/**
 * Compute a secure SHA-256 hash of the OTP for storage.
 * Plaintext OTPs are never stored in the database.
 */
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

/**
 * Perform a constant-time comparison of the provided OTP against the stored hash.
 */
export function verifyOtpHash(plainOtp: string, storedHash: string): boolean {
  if (!plainOtp || !storedHash) return false;
  
  const computedHash = hashOtp(plainOtp);
  
  const a = Buffer.from(computedHash, "utf8");
  const b = Buffer.from(storedHash, "utf8");

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

/**
 * Calculate the expiration timestamp for a newly issued OTP (10 minutes).
 */
export function getOtpExpiryDate(minutes = OTP_EXPIRATION_MINUTES): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
