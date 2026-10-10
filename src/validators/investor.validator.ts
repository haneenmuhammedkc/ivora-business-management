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

export interface UpdateInvestorInputData {
  name?: unknown;
  email?: unknown;
  contactEmail?: unknown;
  phone?: unknown;
  investmentAmount?: unknown;
  investmentCapitalAED?: unknown;
  committedAmount?: unknown;
  status?: unknown;
}

export interface UpdateInvestorValidatedData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  investmentAmount?: number;
  status?: "ACTIVE" | "INACTIVE";
}

export interface UpdateInvestorValidationResult {
  isValid: boolean;
  errors: InvestorValidationErrors;
  data?: UpdateInvestorValidatedData;
}

/**
 * Validates and sanitizes update investor input.
 * Allows partial updates for editable fields (name, email, phone, investmentAmount, status).
 * Rejects illegal status values and ignores immutable fields (id, code, type, businessId, createdAt).
 */
export function validateUpdateInvestor(input: unknown): UpdateInvestorValidationResult {
  const errors: InvestorValidationErrors = {};

  if (!input || typeof input !== "object") {
    return {
      isValid: false,
      errors: {
        general: "Invalid submission data.",
      },
    };
  }

  const raw = input as UpdateInvestorInputData;
  const sanitized: UpdateInvestorValidatedData = {};

  // 1. Name Validation (optional for partial update, but if present must be valid)
  if (raw.name !== undefined) {
    const nameError = validateInvestorName(raw.name);
    if (nameError) {
      errors.name = nameError;
    } else if (typeof raw.name === "string") {
      sanitized.name = raw.name.trim().replace(/\s+/g, " ");
    }
  }

  // 2. Email Validation
  const rawEmail = raw.email !== undefined ? raw.email : raw.contactEmail;
  if (rawEmail !== undefined) {
    const emailError = validateInvestorEmail(rawEmail);
    if (emailError) {
      errors.email = emailError;
    } else if (rawEmail === null || rawEmail === "") {
      sanitized.email = null;
    } else if (typeof rawEmail === "string") {
      const trimmed = rawEmail.trim().toLowerCase();
      sanitized.email = trimmed.length > 0 ? trimmed : null;
    }
  }

  // 3. Phone Validation
  if (raw.phone !== undefined) {
    const phoneError = validateInvestorPhone(raw.phone);
    if (phoneError) {
      errors.phone = phoneError;
    } else if (raw.phone === null || raw.phone === "") {
      sanitized.phone = null;
    } else if (typeof raw.phone === "string") {
      const trimmed = raw.phone.trim();
      sanitized.phone = trimmed.length > 0 ? trimmed : null;
    }
  }

  // 4. Investment Capital Validation
  const rawCapital =
    raw.investmentCapitalAED !== undefined
      ? raw.investmentCapitalAED
      : raw.investmentAmount !== undefined
      ? raw.investmentAmount
      : raw.committedAmount;

  if (rawCapital !== undefined && rawCapital !== null && rawCapital !== "") {
    const capitalError = validateInvestmentAmount(rawCapital);
    if (capitalError) {
      errors.investmentAmount = capitalError;
    } else {
      const parsed = parseFinancialAmount(rawCapital, "Investment capital", { required: true });
      if (parsed.error) {
        errors.investmentAmount = parsed.error;
      } else if (parsed.parsedValue !== null) {
        sanitized.investmentAmount = parsed.parsedValue;
      }
    }
  }

  // 5. Status Validation
  if (raw.status !== undefined) {
    if (raw.status === "ACTIVE" || raw.status === "INACTIVE") {
      sanitized.status = raw.status;
    } else {
      errors.general = "Status must be either ACTIVE or INACTIVE.";
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid ? sanitized : undefined,
  };
}

export interface ProfitAllocationValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  data?: {
    allocatedProfitAmount: number;
  };
}

/**
 * Validates Profit Allocation amount.
 */
export function validateProfitAllocationInput(input: unknown): ProfitAllocationValidationResult {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: { general: "Invalid allocation payload." } };
  }

  const raw = input as { allocatedProfitAmount?: unknown; allocatedProfitAED?: unknown; amount?: unknown };
  const rawVal =
    raw.allocatedProfitAmount !== undefined
      ? raw.allocatedProfitAmount
      : raw.allocatedProfitAED !== undefined
      ? raw.allocatedProfitAED
      : raw.amount;

  if (rawVal === undefined || rawVal === null || rawVal === "") {
    errors.allocatedProfitAmount = "Allocated profit amount is required.";
  } else {
    const rawStr = String(rawVal).trim();
    if (!/^\d+(\.\d+)?$/.test(rawStr)) {
      errors.allocatedProfitAmount = "Allocated profit must be a valid non-negative number.";
    } else {
      const num = Number(rawStr);
      if (isNaN(num) || !isFinite(num) || num < 0) {
        errors.allocatedProfitAmount = "Allocated profit cannot be negative.";
      } else if (num > 999_999_999.99) {
        errors.allocatedProfitAmount = "Allocated profit exceeds maximum allowed limit.";
      } else {
        const decimalPart = rawStr.split(".")[1];
        if (decimalPart && decimalPart.length > 2) {
          errors.allocatedProfitAmount = "Allocated profit cannot have more than 2 decimal places.";
        }
      }
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    errors,
    data: isValid ? { allocatedProfitAmount: Number(Number(rawVal).toFixed(2)) } : undefined,
  };
}

export interface DisbursalPaymentValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  data?: {
    capitalAmount: number;
    profitAmount: number;
    paymentMethod: "DIRECT_BANK_WIRE" | "ESCROW_TRANSFER" | "CASH_VAULT" | "CHEQUE";
    bankReference?: string | null;
    escrowAccount?: string | null;
    transactionDate?: string;
    notes?: string;
  };
}

/**
 * Validates Disbursal Payment submission.
 */
export function validateDisbursalPaymentInput(input: unknown): DisbursalPaymentValidationResult {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: { general: "Invalid payment payload." } };
  }

  const raw = input as {
    capitalAmount?: unknown;
    profitAmount?: unknown;
    paymentMethod?: unknown;
    bankReference?: unknown;
    escrowAccount?: unknown;
    transactionDate?: unknown;
    notes?: unknown;
  };

  let parsedCap = 0;
  let parsedPrf = 0;

  // Validate Capital Amount
  if (raw.capitalAmount !== undefined && raw.capitalAmount !== null && raw.capitalAmount !== "") {
    const capStr = String(raw.capitalAmount).trim();
    if (!/^\d+(\.\d+)?$/.test(capStr)) {
      errors.capitalAmount = "Capital amount must be a valid non-negative number.";
    } else {
      const num = Number(capStr);
      if (isNaN(num) || !isFinite(num) || num < 0) {
        errors.capitalAmount = "Capital amount cannot be negative.";
      } else {
        parsedCap = Number(num.toFixed(2));
      }
    }
  }

  // Validate Profit Amount
  if (raw.profitAmount !== undefined && raw.profitAmount !== null && raw.profitAmount !== "") {
    const prfStr = String(raw.profitAmount).trim();
    if (!/^\d+(\.\d+)?$/.test(prfStr)) {
      errors.profitAmount = "Profit amount must be a valid non-negative number.";
    } else {
      const num = Number(prfStr);
      if (isNaN(num) || !isFinite(num) || num < 0) {
        errors.profitAmount = "Profit amount cannot be negative.";
      } else {
        parsedPrf = Number(num.toFixed(2));
      }
    }
  }

  if (parsedCap + parsedPrf <= 0 && !errors.capitalAmount && !errors.profitAmount) {
    errors.general = "Total payment amount (Capital + Profit) must be greater than zero.";
  }

  // Validate Payment Method
  const validMethods = ["DIRECT_BANK_WIRE", "ESCROW_TRANSFER", "CASH_VAULT", "CHEQUE"];
  const methodStr = typeof raw.paymentMethod === "string" ? raw.paymentMethod.trim().toUpperCase() : "DIRECT_BANK_WIRE";
  if (!validMethods.includes(methodStr)) {
    errors.paymentMethod = "Invalid payment method selected.";
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid
      ? {
          capitalAmount: parsedCap,
          profitAmount: parsedPrf,
          paymentMethod: methodStr as "DIRECT_BANK_WIRE" | "ESCROW_TRANSFER" | "CASH_VAULT" | "CHEQUE",
          bankReference: typeof raw.bankReference === "string" ? raw.bankReference.trim() : null,
          escrowAccount: typeof raw.escrowAccount === "string" ? raw.escrowAccount.trim() : null,
          transactionDate: typeof raw.transactionDate === "string" ? raw.transactionDate.trim() : undefined,
          notes: typeof raw.notes === "string" ? raw.notes.trim() : undefined,
        }
      : undefined,
  };
}

