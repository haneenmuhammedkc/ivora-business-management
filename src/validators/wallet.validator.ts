import { PaymentMethod } from "@prisma/client";

export const WALLET_MAX_TRANSACTION_AMOUNT = 999_999_999.99;

export interface DepositWalletInput {
  amount?: unknown;
  paymentMethod?: unknown;
  reference?: unknown;
  notes?: unknown;
  date?: unknown;
  idempotencyKey?: unknown;
}

export interface AllocateWalletInput {
  businessId?: unknown;
  sourceBusinessId?: unknown;
  amount?: unknown;
  additionalAmount?: unknown;
  additionalPaymentMethod?: unknown;
  additionalReference?: unknown;
  additionalDate?: unknown;
  profitSharePct?: unknown;
  notes?: unknown;
  reference?: unknown;
  idempotencyKey?: unknown;
}

export interface RequestWithdrawalInput {
  amount?: unknown;
  paymentMethod?: unknown;
  bankReference?: unknown;
  notes?: unknown;
  idempotencyKey?: unknown;
}

export interface ProcessWithdrawalInput {
  notes?: unknown;
}

export function parseWalletAmount(
  val: unknown,
  fieldName = "Amount"
): { error: string | null; parsedValue: number | null } {
  if (val === undefined || val === null || val === "") {
    return { error: `${fieldName} is required and must be greater than 0.`, parsedValue: null };
  }

  const rawStr = String(val).trim();
  if (rawStr === "") {
    return { error: `${fieldName} is required and must be greater than 0.`, parsedValue: null };
  }

  if (!/^\d+(\.\d+)?$/.test(rawStr)) {
    return { error: `${fieldName} must be a valid positive number.`, parsedValue: null };
  }

  const decimalPart = rawStr.split(".")[1];
  if (decimalPart && decimalPart.length > 2) {
    return { error: `${fieldName} cannot have more than 2 decimal places.`, parsedValue: null };
  }

  const num = Number(rawStr);
  if (isNaN(num) || !isFinite(num) || num <= 0) {
    return { error: `${fieldName} must be greater than 0.`, parsedValue: null };
  }

  if (num > WALLET_MAX_TRANSACTION_AMOUNT) {
    return {
      error: `${fieldName} exceeds maximum allowable limit of AED ${WALLET_MAX_TRANSACTION_AMOUNT.toLocaleString()}.`,
      parsedValue: null,
    };
  }

  return { error: null, parsedValue: num };
}

export function validatePaymentMethod(
  val: unknown
): { error: string | null; method: PaymentMethod | null } {
  const allowed = Object.values(PaymentMethod);
  if (!val || typeof val !== "string" || !allowed.includes(val as PaymentMethod)) {
    return {
      error: `Invalid payment method. Allowed options: ${allowed.join(", ")}`,
      method: null,
    };
  }
  return { error: null, method: val as PaymentMethod };
}
