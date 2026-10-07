/**
 * Business Validation Constants, Types, and Functions
 * Single source of truth for New Business input validation across client and server.
 */

export const BUSINESS_NAME_MIN_LENGTH = 2;
export const BUSINESS_NAME_MAX_LENGTH = 100;
export const BUSINESS_TYPE_MIN_LENGTH = 2;
export const BUSINESS_TYPE_MAX_LENGTH = 50;
export const BUSINESS_DESCRIPTION_MAX_LENGTH = 500;
export const MAX_INVESTMENT_AMOUNT = 999_999_999.99;

export interface CreateBusinessInput {
  businessName?: unknown;
  name?: unknown;
  businessType?: unknown;
  totalInvestment?: unknown;
  description?: unknown;
  partnerId?: unknown;
  adminInvestment?: unknown;
  partnerInvestment?: unknown;
}

export interface CreateBusinessValidatedData {
  name: string;
  businessType: string;
  totalInvestment: number;
  description: string | null;
  partnerId: string;
  adminInvestment: number;
  partnerInvestment: number;
}

export type BusinessValidationErrorKey =
  | "businessName"
  | "businessType"
  | "description"
  | "totalInvestment"
  | "partnerId"
  | "adminInvestment"
  | "partnerInvestment"
  | "general";

export type BusinessValidationErrors = Partial<Record<BusinessValidationErrorKey, string>>;

export interface BusinessValidationResult {
  isValid: boolean;
  errors: BusinessValidationErrors;
  data?: CreateBusinessValidatedData;
}

/**
 * Validates a decimal currency string/number.
 * Enforces maximum 2 decimal places, finite numeric bounds, and upper limit.
 */
function parseFinancialAmount(
  val: unknown,
  fieldName: string,
  options: { required?: boolean; max?: number } = {}
): { error: string | null; parsedValue: number | null } {
  const { required = false, max = MAX_INVESTMENT_AMOUNT } = options;

  if (val === undefined || val === null || val === "") {
    if (required) {
      return { error: `${fieldName} is required.`, parsedValue: null };
    }
    return { error: null, parsedValue: 0 };
  }

  const rawStr = String(val).trim();
  if (rawStr === "") {
    if (required) {
      return { error: `${fieldName} is required.`, parsedValue: null };
    }
    return { error: null, parsedValue: 0 };
  }

  // Check valid numeric pattern (positive digits, optional single decimal point)
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

  if (num < 0) {
    return {
      error: `${fieldName} cannot be negative.`,
      parsedValue: null,
    };
  }

  if (max !== undefined && num > max) {
    return {
      error: `${fieldName} cannot exceed ${max.toLocaleString("en-US", { maximumFractionDigits: 2 })} AED.`,
      parsedValue: null,
    };
  }

  // Safe rounding to 2 decimals
  const rounded = Math.round(num * 100) / 100;
  return { error: null, parsedValue: rounded };
}

/**
 * Validates business name.
 * - Required
 * - 2-100 characters
 * - Cannot be only whitespace
 * - Cannot be only special characters (must have at least one letter/number)
 */
export function validateBusinessName(name: unknown): string | null {
  if (typeof name !== "string" || !name.trim()) {
    return "Business name is required (2–100 characters).";
  }

  const normalized = name.trim().replace(/\s+/g, " ");

  if (normalized.length < BUSINESS_NAME_MIN_LENGTH || normalized.length > BUSINESS_NAME_MAX_LENGTH) {
    return `Business name must be between ${BUSINESS_NAME_MIN_LENGTH} and ${BUSINESS_NAME_MAX_LENGTH} characters.`;
  }

  // Must contain at least one alphanumeric character
  if (!/[a-zA-Z0-9]/.test(normalized)) {
    return "Business name must contain at least one letter or number.";
  }

  return null;
}

/**
 * Validates business type.
 * - Required
 * - 2-50 characters
 * - Alphanumeric / standard text
 */
export function validateBusinessType(type: unknown): string | null {
  if (typeof type !== "string" || !type.trim()) {
    return "Business type is required (e.g. Retail, Tech, Services).";
  }

  const normalized = type.trim().replace(/\s+/g, " ");

  if (normalized.length < BUSINESS_TYPE_MIN_LENGTH || normalized.length > BUSINESS_TYPE_MAX_LENGTH) {
    return `Business type must be between ${BUSINESS_TYPE_MIN_LENGTH} and ${BUSINESS_TYPE_MAX_LENGTH} characters.`;
  }

  if (!/[a-zA-Z0-9]/.test(normalized)) {
    return "Business type must contain valid text.";
  }

  return null;
}

/**
 * Validates total investment amount.
 * - Required
 * - Numeric, finite
 * - > 0
 * - Max 999,999,999.99
 * - Max 2 decimal places
 */
export function validateTotalInvestment(amount: unknown): string | null {
  if (amount === undefined || amount === null || amount === "") {
    return "Total investment is required and must be greater than 0.";
  }

  const { error, parsedValue } = parseFinancialAmount(amount, "Total investment", {
    required: true,
    max: MAX_INVESTMENT_AMOUNT,
  });

  if (error) return error;

  if (parsedValue === null || parsedValue <= 0) {
    return "Total investment must be greater than 0.";
  }

  return null;
}

/**
 * Validates business description.
 * - Optional
 * - Max 500 characters
 */
export function validateBusinessDescription(desc: unknown): string | null {
  if (desc === undefined || desc === null || desc === "") {
    return null;
  }

  if (typeof desc !== "string") {
    return "Description must be a text value.";
  }

  const trimmed = desc.trim();
  if (trimmed.length > BUSINESS_DESCRIPTION_MAX_LENGTH) {
    return `Description cannot exceed ${BUSINESS_DESCRIPTION_MAX_LENGTH} characters.`;
  }

  return null;
}

/**
 * Validates partner selection ID.
 * - Required
 * - Non-empty string
 */
export function validatePartnerId(id: unknown): string | null {
  if (typeof id !== "string" || !id.trim()) {
    return "Please select a partner for this business.";
  }

  return null;
}

/**
 * Validates admin investment contribution.
 * - Optional
 * - Numeric, >= 0
 * - Cannot exceed totalInvestment (if provided)
 * - Max 2 decimal places
 */
export function validateAdminInvestment(
  amount: unknown,
  totalInvestment?: number
): string | null {
  if (amount === undefined || amount === null || amount === "") {
    return null;
  }

  const { error, parsedValue } = parseFinancialAmount(amount, "Admin investment", {
    required: false,
    max: MAX_INVESTMENT_AMOUNT,
  });

  if (error) return error;

  if (parsedValue !== null && totalInvestment !== undefined && totalInvestment > 0) {
    if (parsedValue > totalInvestment) {
      return "Admin investment cannot exceed total investment.";
    }
  }

  return null;
}

/**
 * Validates partner investment contribution.
 * - Optional
 * - Numeric, >= 0
 * - Cannot exceed totalInvestment (if provided)
 * - Max 2 decimal places
 */
export function validatePartnerInvestment(
  amount: unknown,
  totalInvestment?: number
): string | null {
  if (amount === undefined || amount === null || amount === "") {
    return null;
  }

  const { error, parsedValue } = parseFinancialAmount(amount, "Partner investment", {
    required: false,
    max: MAX_INVESTMENT_AMOUNT,
  });

  if (error) return error;

  if (parsedValue !== null && totalInvestment !== undefined && totalInvestment > 0) {
    if (parsedValue > totalInvestment) {
      return "Partner investment cannot exceed total investment.";
    }
  }

  return null;
}

/**
 * Sanitizes raw business form input into cleaned typed data.
 */
export function sanitizeBusinessInput(input: CreateBusinessInput): CreateBusinessValidatedData {
  const rawName = (input.businessName ?? input.name ?? "") as string;
  const rawType = (input.businessType ?? "") as string;
  const rawDesc = (input.description ?? "") as string;
  const rawPartnerId = (input.partnerId ?? "") as string;

  const totalInvRes = parseFinancialAmount(input.totalInvestment, "Total investment");
  const adminInvRes = parseFinancialAmount(input.adminInvestment, "Admin investment");
  const partnerInvRes = parseFinancialAmount(input.partnerInvestment, "Partner investment");

  const trimmedDesc = typeof rawDesc === "string" ? rawDesc.trim() : "";

  return {
    name: typeof rawName === "string" ? rawName.trim().replace(/\s+/g, " ") : "",
    businessType: typeof rawType === "string" ? rawType.trim().replace(/\s+/g, " ") : "",
    totalInvestment: totalInvRes.parsedValue ?? 0,
    description: trimmedDesc.length > 0 ? trimmedDesc : null,
    partnerId: typeof rawPartnerId === "string" ? rawPartnerId.trim() : "",
    adminInvestment: adminInvRes.parsedValue ?? 0,
    partnerInvestment: partnerInvRes.parsedValue ?? 0,
  };
}

/**
 * Validates complete New Business input data across client and server.
 */
export function validateCreateBusiness(input: unknown): BusinessValidationResult {
  const errors: BusinessValidationErrors = {};

  if (!input || typeof input !== "object") {
    return {
      isValid: false,
      errors: {
        general: "Invalid submission data.",
      },
    };
  }

  const raw = input as CreateBusinessInput;

  // 1. Business Name
  const rawName = raw.businessName ?? raw.name;
  const nameError = validateBusinessName(rawName);
  if (nameError) {
    errors.businessName = nameError;
  }

  // 2. Business Type
  const typeError = validateBusinessType(raw.businessType);
  if (typeError) {
    errors.businessType = typeError;
  }

  // 3. Total Investment
  const totalInvError = validateTotalInvestment(raw.totalInvestment);
  let parsedTotalInvestment: number | undefined;
  if (totalInvError) {
    errors.totalInvestment = totalInvError;
  } else {
    const res = parseFinancialAmount(raw.totalInvestment, "Total investment");
    if (res.parsedValue !== null) {
      parsedTotalInvestment = res.parsedValue;
    }
  }

  // 4. Description
  const descError = validateBusinessDescription(raw.description);
  if (descError) {
    errors.description = descError;
  }

  // 5. Partner ID
  const partnerError = validatePartnerId(raw.partnerId);
  if (partnerError) {
    errors.partnerId = partnerError;
  }

  // 6. Admin Investment
  const adminInvError = validateAdminInvestment(raw.adminInvestment, parsedTotalInvestment);
  let parsedAdminInvestment = 0;
  if (adminInvError) {
    errors.adminInvestment = adminInvError;
  } else {
    const res = parseFinancialAmount(raw.adminInvestment, "Admin investment");
    if (res.parsedValue !== null) {
      parsedAdminInvestment = res.parsedValue;
    }
  }

  // 7. Partner Investment
  const partnerInvError = validatePartnerInvestment(raw.partnerInvestment, parsedTotalInvestment);
  let parsedPartnerInvestment = 0;
  if (partnerInvError) {
    errors.partnerInvestment = partnerInvError;
  } else {
    const res = parseFinancialAmount(raw.partnerInvestment, "Partner investment");
    if (res.parsedValue !== null) {
      parsedPartnerInvestment = res.parsedValue;
    }
  }

  // 8. Cross-Field Validation: Combined Contributions vs Total Investment
  if (
    !errors.totalInvestment &&
    !errors.adminInvestment &&
    !errors.partnerInvestment &&
    parsedTotalInvestment !== undefined
  ) {
    const combinedContributions =
      Math.round((parsedAdminInvestment + parsedPartnerInvestment) * 100) / 100;
    const total = Math.round(parsedTotalInvestment * 100) / 100;

    if (combinedContributions > total) {
      errors.adminInvestment =
        "Sum of admin and partner investments cannot exceed total investment.";
      errors.partnerInvestment =
        "Sum of admin and partner investments cannot exceed total investment.";
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid ? sanitizeBusinessInput(raw) : undefined,
  };
}
