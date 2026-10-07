/**
 * Investor Validation Constants, Types, and Helpers
 * Single source of truth for New Investor input validation across client and server.
 */

export const INVESTOR_NAME_MIN_LENGTH = 2;
export const INVESTOR_NAME_MAX_LENGTH = 100;
export const INVESTOR_EMAIL_MAX_LENGTH = 254;
export const INVESTOR_PHONE_MAX_LENGTH = 30;
export const INVESTOR_MAX_INVESTMENT_AMOUNT = 999_999_999.99;

// Standard email regex consistent with auth and business validators
export const INVESTOR_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CreateInvestorInput {
  name?: unknown;
  email?: unknown;
  contactEmail?: unknown;
  businessId?: unknown;
  investmentAmount?: unknown;
  investmentCapitalAED?: unknown;
  committedAmount?: unknown;
  phone?: unknown;
}

export interface CreateInvestorValidatedData {
  name: string;
  email: string | null;
  businessId: string;
  investmentAmount: number;
  phone: string | null;
}

export type InvestorValidationErrorKey =
  | "name"
  | "email"
  | "businessId"
  | "investmentAmount"
  | "phone"
  | "general";

export type InvestorValidationErrors = Partial<Record<InvestorValidationErrorKey, string>>;

export interface InvestorValidationResult {
  isValid: boolean;
  errors: InvestorValidationErrors;
  data?: CreateInvestorValidatedData;
}

/**
 * Validates a decimal financial amount.
 * Enforces maximum 2 decimal places, positive finite numeric bounds, and upper limit.
 */
function parseFinancialAmount(
  val: unknown,
  fieldName: string,
  options: { required?: boolean; max?: number } = {}
): { error: string | null; parsedValue: number | null } {
  const { required = true, max = INVESTOR_MAX_INVESTMENT_AMOUNT } = options;

  if (val === undefined || val === null || val === "") {
    if (required) {
      return { error: `${fieldName} is required and must be greater than 0.`, parsedValue: null };
    }
    return { error: null, parsedValue: 0 };
  }

  const rawStr = String(val).trim();
  if (rawStr === "") {
    if (required) {
      return { error: `${fieldName} is required and must be greater than 0.`, parsedValue: null };
    }
    return { error: null, parsedValue: 0 };
  }

  // Check valid positive numeric pattern (digits, optional single decimal point)
  if (!/^\d+(\.\d+)?$/.test(rawStr)) {
    return {
      error: `${fieldName} must be a valid positive number.`,
      parsedValue: null,
    };
  }

  // Enforce max 2 decimal places
  const decimalPart = rawStr.split(".")[1];
  if (decimalPart && decimalPart.length > 2) {
    return {
      error: `${fieldName} cannot have more than 2 decimal places.`,
      parsedValue: null,
    };
  }

  const num = Number(rawStr);
  if (isNaN(num) || !isFinite(num)) {
    return {
      error: `${fieldName} must be a valid numeric amount.`,
      parsedValue: null,
    };
  }

  if (num <= 0) {
    return {
      error: `${fieldName} must be greater than 0.`,
      parsedValue: null,
    };
  }

  if (max !== undefined && num > max) {
    return {
      error: `${fieldName} cannot exceed ${max.toLocaleString("en-US", { maximumFractionDigits: 2 })} AED.`,
      parsedValue: null,
    };
  }

  // Safe 2-decimal rounded number
  const rounded = Math.round(num * 100) / 100;
  return { error: null, parsedValue: rounded };
}

/**
 * Validates investor name.
 * - Required
 * - 2-100 characters
 * - Cannot be only whitespace
 * - Cannot be only special characters (must have at least one alphanumeric character)
 * - Trim and normalize repeated internal whitespace
 */
export function validateInvestorName(name: unknown): string | null {
  if (typeof name !== "string" || !name.trim()) {
    return "Investor name is required (2–100 characters).";
  }

  const normalized = name.trim().replace(/\s+/g, " ");

  if (normalized.length < INVESTOR_NAME_MIN_LENGTH || normalized.length > INVESTOR_NAME_MAX_LENGTH) {
    return `Investor name must be between ${INVESTOR_NAME_MIN_LENGTH} and ${INVESTOR_NAME_MAX_LENGTH} characters.`;
  }

  if (!/[a-zA-Z0-9]/.test(normalized)) {
    return "Investor name must contain at least one letter or number.";
  }

  return null;
}

/**
 * Validates investor email.
 * - Optional
 * - If provided: max 254 characters, standard email regex
 */
export function validateInvestorEmail(email: unknown): string | null {
  if (email === undefined || email === null || email === "") {
    return null;
  }

  if (typeof email !== "string") {
    return "Email address must be a text value.";
  }

  const trimmed = email.trim();
  if (trimmed === "") {
    return null;
  }

  if (trimmed.length > INVESTOR_EMAIL_MAX_LENGTH) {
    return "Email address cannot exceed 254 characters.";
  }

  if (!INVESTOR_EMAIL_REGEX.test(trimmed)) {
    return "Please enter a valid email address (e.g. investor@company.com).";
  }

  return null;
}

/**
 * Validates businessId.
 * - Required non-empty string
 */
export function validateBusinessId(id: unknown): string | null {
  if (typeof id !== "string" || !id.trim()) {
    return "Please select an assigned business entity.";
  }

  return null;
}

/**
 * Validates investment capital amount.
 * - Required
 * - Numeric, finite, > 0
 * - Max 999,999,999.99 AED
 * - Max 2 decimal places
 */
export function validateInvestmentAmount(amount: unknown): string | null {
  if (amount === undefined || amount === null || amount === "") {
    return "Investment capital must be a valid positive amount greater than 0.";
  }

  const { error } = parseFinancialAmount(amount, "Investment capital", {
    required: true,
    max: INVESTOR_MAX_INVESTMENT_AMOUNT,
  });

  return error;
}

/**
 * Validates investor phone number (if present).
 * - Optional
 * - Max 30 characters
 */
export function validateInvestorPhone(phone: unknown): string | null {
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

  if (trimmed.length > INVESTOR_PHONE_MAX_LENGTH) {
    return `Phone number cannot exceed ${INVESTOR_PHONE_MAX_LENGTH} characters.`;
  }

  if (!/^[+\d\s().-]+$/.test(trimmed)) {
    return "Phone number contains invalid characters.";
  }

  return null;
}

/**
 * Sanitizes raw investor input into clean typed data.
 */
export function sanitizeInvestorInput(input: CreateInvestorInput): CreateInvestorValidatedData {
  const rawName = (input.name ?? "") as string;
  const rawEmail = (input.email ?? input.contactEmail ?? "") as string;
  const rawBusinessId = (input.businessId ?? "") as string;
  const rawPhone = (input.phone ?? "") as string;

  const rawCapital = input.investmentCapitalAED ?? input.investmentAmount ?? input.committedAmount;
  const parsedCapital = parseFinancialAmount(rawCapital, "Investment capital", { required: true });

  const trimmedEmail = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const trimmedPhone = typeof rawPhone === "string" ? rawPhone.trim() : "";

  return {
    name: typeof rawName === "string" ? rawName.trim().replace(/\s+/g, " ") : "",
    email: trimmedEmail.length > 0 ? trimmedEmail : null,
    businessId: typeof rawBusinessId === "string" ? rawBusinessId.trim() : "",
    investmentAmount: parsedCapital.parsedValue ?? 0,
    phone: trimmedPhone.length > 0 ? trimmedPhone : null,
  };
}

/**
 * Central validator for New Investor input across client UI and server API.
 */
export function validateCreateInvestor(input: unknown): InvestorValidationResult {
  const errors: InvestorValidationErrors = {};

  if (!input || typeof input !== "object") {
    return {
      isValid: false,
      errors: {
        general: "Invalid submission data.",
      },
    };
  }

  const raw = input as CreateInvestorInput;

  // 1. Name Validation
  const nameError = validateInvestorName(raw.name);
  if (nameError) {
    errors.name = nameError;
  }

  // 2. Email Validation
  const rawEmail = raw.email ?? raw.contactEmail;
  const emailError = validateInvestorEmail(rawEmail);
  if (emailError) {
    errors.email = emailError;
  }

  // 3. Business ID Validation
  const businessIdError = validateBusinessId(raw.businessId);
  if (businessIdError) {
    errors.businessId = businessIdError;
  }

  // 4. Investment Capital Validation
  const rawCapital = raw.investmentCapitalAED ?? raw.investmentAmount ?? raw.committedAmount;
  const capitalError = validateInvestmentAmount(rawCapital);
  if (capitalError) {
    errors.investmentAmount = capitalError;
  }

  // 5. Phone Validation (if provided)
  if (raw.phone !== undefined && raw.phone !== null && raw.phone !== "") {
    const phoneError = validateInvestorPhone(raw.phone);
    if (phoneError) {
      errors.phone = phoneError;
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid ? sanitizeInvestorInput(raw) : undefined,
  };
}
