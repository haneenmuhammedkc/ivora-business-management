import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { AuthError } from "@/lib/auth/guards";
import { requireBusinessAccess } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, TransactionType, PaymentMethod, UserRole } from "@prisma/client";

export interface CreateTransactionInput {
  businessId: string;
  investorId?: string;
  transactionCode: string;
  amount: number;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  bankReference?: string;
  escrowAccount?: string;
  transactionDate: string | Date;
}

export async function listTransactions(session: SessionPayload, businessId?: string) {
  if (businessId) {
    await requireBusinessAccess(businessId);
    return prisma.transaction.findMany({
      where: { businessId },
      include: {
        business: { select: { id: true, name: true, code: true } },
        investor: { select: { id: true, name: true, code: true } },
      },
      orderBy: { transactionDate: "desc" },
    });
  }

  const where: Prisma.TransactionWhereInput =
    session.role === UserRole.ADMIN
      ? {}
      : { business: { partnerId: session.userId } };

  return prisma.transaction.findMany({
    where,
    include: {
      business: { select: { id: true, name: true, code: true } },
      investor: { select: { id: true, name: true, code: true } },
    },
    orderBy: { transactionDate: "desc" },
  });
}

export async function createTransaction(session: SessionPayload, input: CreateTransactionInput) {
  await requireBusinessAccess(input.businessId);

  const transaction = await prisma.transaction.create({
    data: {
      businessId: input.businessId,
      investorId: input.investorId || null,
      transactionCode: input.transactionCode.trim(),
      amount: new Prisma.Decimal(input.amount),
      type: input.type,
      paymentMethod: input.paymentMethod,
      bankReference: input.bankReference?.trim() || null,
      escrowAccount: input.escrowAccount?.trim() || null,
      transactionDate: new Date(input.transactionDate),
    },
    include: {
      business: { select: { id: true, name: true, code: true } },
      investor: { select: { id: true, name: true, code: true } },
    },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "TRANSACTION_CREATED",
    entity: "Transaction",
    entityId: transaction.id,
    newValues: { code: transaction.transactionCode, amount: input.amount, type: input.type },
  });

  return transaction;
}

export async function blockTransactionMutation(): Promise<never> {
  throw new AuthError("Transaction records are immutable ledger entries and cannot be modified or deleted.", 403);
}
