import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: Record<string, unknown> | Prisma.InputJsonValue | null;
  newValues?: Record<string, unknown> | Prisma.InputJsonValue | null;
  ipAddress?: string | null;
}

/**
 * Record an audit log entry.
 * Note: Never include passwords, tokens, hashes, or credentials in oldValues/newValues.
 */
export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId || null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        oldValues: (input.oldValues as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        newValues: (input.newValues as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        ipAddress: input.ipAddress || null,
      },
    });
  } catch (error) {
    // Audit logging should not crash critical operations, but log errors server-side
    console.error("[AuditLog Error]", error);
  }
}
