import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess } from "@/lib/auth/authorization";
import { AuthError } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, QuantityUnit, SaleStatus, UserRole } from "@prisma/client";
import {
  createSaleSchema,
  updateSaleSchema,
} from "@/validators/sale.validator";

export interface CreateSaleInput {
  businessId: string;
  tradingCycleId?: string | null;
  saleCode?: string;
  saleDate: string | Date;
  liquidationDesk?: string | null;
  buyerFirm: string;
  productType: string;
  quantity: number | string;
  quantityUnit?: QuantityUnit | "GRAM" | "PIECE" | "GRAMS" | "PIECES";
  totalSellingPriceINR: number | string;
  realizedFxRate: number | string;
  basePricePerUnitAED?: number | string | null;
  inrRealizationValue?: number | string | null;
  status?: SaleStatus;
}

export interface UpdateSaleInput {
  businessId?: string;
  saleDate?: string | Date;
  liquidationDesk?: string | null;
  buyerFirm?: string;
  productType?: string;
  quantity?: number | string;
  quantityUnit?: QuantityUnit | "GRAM" | "PIECE" | "GRAMS" | "PIECES";
  totalSellingPriceINR?: number | string;
  realizedFxRate?: number | string;
  basePricePerUnitAED?: number | string | null;
  inrRealizationValue?: number | string | null;
  status?: SaleStatus;
}

/**
 * Generate a unique sequential sale code, e.g. SL-0001, SL-0249.
 */
export async function generateUniqueSaleCode(
  tx: Prisma.TransactionClient = prisma
): Promise<string> {
  const latest = await tx.sale.findFirst({
    orderBy: { createdAt: "desc" },
    select: { saleCode: true },
  });

  let nextNum = 1;
  if (latest?.saleCode) {
    const match = latest.saleCode.match(/\bSL-(\d+)\b/i);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    } else {
      const count = await tx.sale.count();
      nextNum = count + 1;
    }
  }

  let code = `SL-${String(nextNum).padStart(4, "0")}`;
  let attempt = 0;
  while (await tx.sale.findUnique({ where: { saleCode: code } })) {
    nextNum++;
    code = `SL-${String(nextNum).padStart(4, "0")}`;
    attempt++;
    if (attempt > 100) break;
  }

  return code;
}

/**
 * Reconciles the inventory record for a given Business + Product + Unit
 * based on all historical Purchases and Sales.
 */
export async function reconcileInventory(
  tx: Prisma.TransactionClient,
  businessId: string,
  productType: string,
  quantityUnit: QuantityUnit
) {
  // Aggregate purchases
  const purchases = await tx.purchase.findMany({
    where: {
      businessId,
      productType,
      quantityUnit,
    },
    select: {
      quantity: true,
      baseAcquisitionValue: true,
      purchaseDate: true,
    },
  });

  const totalPurchasedQuantity = purchases.reduce(
    (acc, p) => acc.plus(new Prisma.Decimal(p.quantity || 0)),
    new Prisma.Decimal(0)
  );

  const totalCostAED = purchases.reduce(
    (acc, p) => acc.plus(new Prisma.Decimal(p.baseAcquisitionValue || 0)),
    new Prisma.Decimal(0)
  );

  let lastPurchaseDate: Date | null = null;
  for (const p of purchases) {
    const d = new Date(p.purchaseDate);
    if (!lastPurchaseDate || d > lastPurchaseDate) {
      lastPurchaseDate = d;
    }
  }

  // Aggregate sales
  const sales = await tx.sale.findMany({
    where: {
      businessId,
      productType,
      quantityUnit,
    },
    select: {
      quantity: true,
    },
  });

  const totalSoldQuantity = sales.reduce(
    (acc, s) => acc.plus(new Prisma.Decimal(s.quantity || 0)),
    new Prisma.Decimal(0)
  );

  const remainingQuantity = totalPurchasedQuantity.minus(totalSoldQuantity);

  const averageCostPerUnitAED = totalPurchasedQuantity.greaterThan(0)
    ? totalCostAED.div(totalPurchasedQuantity).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
    : new Prisma.Decimal(0);

  const carryingValueAED = remainingQuantity.greaterThan(0)
    ? remainingQuantity.mul(averageCostPerUnitAED).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
    : new Prisma.Decimal(0);

  return tx.inventory.upsert({
    where: {
      businessId_productType_quantityUnit: {
        businessId,
        productType,
        quantityUnit,
      },
    },
    create: {
      businessId,
      productType,
      quantityUnit,
      totalPurchasedQuantity,
      totalSoldQuantity,
      remainingQuantity,
      totalCostAED,
      carryingValueAED,
      averageCostPerUnitAED,
      lastPurchaseDate,
    },
    update: {
      totalPurchasedQuantity,
      totalSoldQuantity,
      remainingQuantity,
      totalCostAED,
      carryingValueAED,
      averageCostPerUnitAED,
      lastPurchaseDate,
    },
  });
}

/**
 * Returns available products with remaining inventory for an assigned Business.
 * Sorted by newest purchase activity first.
 */
export async function getAvailableProductsForBusiness(
  session: SessionPayload,
  businessId: string
) {
  await requireBusinessAccess(businessId, session);

  // Find all distinct product types and units purchased for this business
  const distinctProducts = await prisma.purchase.findMany({
    where: { businessId },
    select: {
      productType: true,
      quantityUnit: true,
    },
    distinct: ["productType", "quantityUnit"],
  });

  const results: Array<{
    productType: string;
    quantityUnit: QuantityUnit;
    remainingQuantity: number;
    averageCostPerUnitAED: number;
    lastPurchaseDate: string | null;
  }> = [];

  for (const item of distinctProducts) {
    const inv = await prisma.$transaction(async (tx) => {
      return reconcileInventory(tx, businessId, item.productType, item.quantityUnit);
    });

    if (Number(inv.remainingQuantity) > 0) {
      results.push({
        productType: inv.productType,
        quantityUnit: inv.quantityUnit,
        remainingQuantity: Number(inv.remainingQuantity),
        averageCostPerUnitAED: Number(inv.averageCostPerUnitAED),
        lastPurchaseDate: inv.lastPurchaseDate ? inv.lastPurchaseDate.toISOString() : null,
      });
    }
  }

  // Sort: Newest purchase activity first
  results.sort((a, b) => {
    const dateA = a.lastPurchaseDate ? new Date(a.lastPurchaseDate).getTime() : 0;
    const dateB = b.lastPurchaseDate ? new Date(b.lastPurchaseDate).getTime() : 0;
    return dateB - dateA;
  });

  return results;
}

/**
 * List sales filtered by session permissions and optional businessId.
 */
export async function listSales(session: SessionPayload, businessId?: string) {
  if (businessId) {
    await requireBusinessAccess(businessId, session);
    return prisma.sale.findMany({
      where: { businessId },
      include: { business: { select: { id: true, name: true, code: true } } },
      orderBy: { saleDate: "desc" },
    });
  }

  const where: Prisma.SaleWhereInput =
    session.role === UserRole.ADMIN
      ? {}
      : { business: { partnerId: session.userId } };

  return prisma.sale.findMany({
    where,
    include: { business: { select: { id: true, name: true, code: true } } },
    orderBy: { saleDate: "desc" },
  });
}

/**
 * Get a single sale by ID with access control.
 */
export async function getSaleById(session: SessionPayload, saleId: string) {
  const { resource } = await requireResourceAccess("Sale", saleId, "READ", session);
  return resource;
}

/**
 * Creates a Sale atomically within a transaction with concurrency protection,
 * inventory consumption, and authoritative Decimal financial calculation.
 */
export async function createSale(session: SessionPayload, input: CreateSaleInput) {
  // 1. Zod Validation
  const validationResult = createSaleSchema.safeParse(input);
  if (!validationResult.success) {
    const firstIssue = validationResult.error.issues[0];
    throw new AuthError(firstIssue ? firstIssue.message : "Invalid sale input data", 400);
  }
  const validated = validationResult.data;

  // 2. Business Access Verification
  await requireBusinessAccess(validated.businessId, session);

  // 3. Atomic Database Transaction
  const sale = await prisma.$transaction(
    async (tx) => {
      // Step A: Reconcile / ensure inventory record exists
      let inv = await tx.inventory.findUnique({
        where: {
          businessId_productType_quantityUnit: {
            businessId: validated.businessId,
            productType: validated.productType,
            quantityUnit: validated.quantityUnit,
          },
        },
      });

      if (!inv) {
        inv = await reconcileInventory(
          tx,
          validated.businessId,
          validated.productType,
          validated.quantityUnit
        );
      }

      // Step B: Concurrency Lock — SELECT ... FOR UPDATE
      const [lockedInv] = await tx.$queryRaw<
        Array<{
          id: string;
          remainingQuantity: Prisma.Decimal;
          averageCostPerUnitAED: Prisma.Decimal;
          totalSoldQuantity: Prisma.Decimal;
        }>
      >`
        SELECT id, "remainingQuantity", "averageCostPerUnitAED", "totalSoldQuantity"
        FROM "Inventory"
        WHERE "businessId" = ${validated.businessId}
          AND "productType" = ${validated.productType}
          AND "quantityUnit" = ${validated.quantityUnit}::"QuantityUnit"
        FOR UPDATE
      `;

      const unitLabel = validated.quantityUnit === QuantityUnit.PIECE ? "PCS" : "GMS";
      const saleQtyDecimal = new Prisma.Decimal(validated.quantity);

      if (!lockedInv || Number(lockedInv.remainingQuantity) <= 0) {
        throw new AuthError(
          `Only 0 ${unitLabel} are available. You cannot sell ${saleQtyDecimal.toString()} ${unitLabel}.`,
          400
        );
      }

      const remainingDecimal = new Prisma.Decimal(lockedInv.remainingQuantity);

      if (saleQtyDecimal.greaterThan(remainingDecimal)) {
        throw new AuthError(
          `Only ${remainingDecimal.toString()} ${unitLabel} are available. You cannot sell ${saleQtyDecimal.toString()} ${unitLabel}.`,
          400
        );
      }

      // Step C: Authoritative Financial Arithmetic
      const inrRealizationDecimal = new Prisma.Decimal(validated.totalSellingPriceINR).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      );
      const fxRateDecimal = new Prisma.Decimal(validated.realizedFxRate).toDecimalPlaces(
        4,
        Prisma.Decimal.ROUND_HALF_UP
      );

      if (fxRateDecimal.lte(0)) {
        throw new AuthError("Realized FX rate must be greater than zero", 400);
      }

      const exactAedTotal = inrRealizationDecimal.div(fxRateDecimal);
      const aedEquivalentDecimal = exactAedTotal.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      // SALES BASE PRICE = Total Selling Price INR ÷ FX Rate ÷ Quantity
      const salesBasePriceDecimal = exactAedTotal
        .div(saleQtyDecimal)
        .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

      const inventoryCostBasis = new Prisma.Decimal(
        lockedInv.averageCostPerUnitAED
      ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

      // Step D: Update Inventory Atomically
      const newRemaining = remainingDecimal.minus(saleQtyDecimal);
      const newTotalSold = new Prisma.Decimal(lockedInv.totalSoldQuantity).plus(saleQtyDecimal);
      const newCarryingValue = newRemaining
        .mul(inventoryCostBasis)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      await tx.inventory.update({
        where: { id: lockedInv.id },
        data: {
          remainingQuantity: newRemaining,
          totalSoldQuantity: newTotalSold,
          carryingValueAED: newCarryingValue,
        },
      });

      // Step E: Auto-generate Sale Code if missing
      const saleCode = validated.saleCode || (await generateUniqueSaleCode(tx));

      // Step F: Create Sale Record
      const createdSale = await tx.sale.create({
        data: {
          saleCode,
          businessId: validated.businessId,
          tradingCycleId: validated.tradingCycleId || null,
          saleDate: validated.saleDate,
          liquidationDesk: validated.liquidationDesk?.trim() || "Direct Settlement",
          buyerFirm: validated.buyerFirm.trim(),
          productType: validated.productType.trim(),
          quantity: saleQtyDecimal,
          quantityUnit: validated.quantityUnit,
          quantityGms:
            validated.quantityUnit === QuantityUnit.GRAM ? saleQtyDecimal : null,
          sellingPricePerGm:
            validated.quantityUnit === QuantityUnit.GRAM ? salesBasePriceDecimal : null,
          basePricePerUnitAED: salesBasePriceDecimal,
          totalSellingPriceINR: inrRealizationDecimal,
          inrRealizationValue: inrRealizationDecimal,
          realizedFxRate: fxRateDecimal,
          aedEquivalent: aedEquivalentDecimal,
          status: validated.status || SaleStatus.PENDING,
        },
        include: { business: { select: { id: true, name: true, code: true } } },
      });

      return createdSale;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      timeout: 15000,
    }
  );

  // 4. Audit Log
  await logAuditEvent({
    userId: session.userId,
    action: "SALE_CREATED",
    entity: "Sale",
    entityId: sale.id,
    newValues: {
      saleCode: sale.saleCode,
      businessId: sale.businessId,
      productType: sale.productType,
      quantity: sale.quantity.toString(),
      quantityUnit: sale.quantityUnit,
      totalSellingPriceINR: sale.totalSellingPriceINR?.toString(),
      aedEquivalent: sale.aedEquivalent.toString(),
      basePricePerUnitAED: sale.basePricePerUnitAED?.toString(),
    },
  });

  return sale;
}

/**
 * Updates an existing Sale atomically with inventory rebalancing.
 */
export async function updateSale(
  session: SessionPayload,
  saleId: string,
  input: UpdateSaleInput
) {
  // 1. Mutability and IDOR Check
  const { resource: existing } = await requireResourceAccess<
    Prisma.SaleGetPayload<Record<string, never>>
  >("Sale", saleId, "WRITE", session);

  // 2. Zod Validation
  const validationResult = updateSaleSchema.safeParse(input);
  if (!validationResult.success) {
    const firstIssue = validationResult.error.issues[0];
    throw new AuthError(firstIssue ? firstIssue.message : "Invalid sale input data", 400);
  }
  const validated = validationResult.data;

  // 3. Database Transaction
  const updated = await prisma.$transaction(
    async (tx) => {
      const targetBusinessId = validated.businessId || existing.businessId;
      const targetProductType = validated.productType || existing.productType;
      const targetQuantityUnit =
        validated.quantityUnit || existing.quantityUnit || QuantityUnit.GRAM;

      const newQtyDecimal =
        validated.quantity !== undefined
          ? new Prisma.Decimal(validated.quantity)
          : new Prisma.Decimal(existing.quantity || existing.quantityGms || 0);

      const oldQtyDecimal = new Prisma.Decimal(
        existing.quantity || existing.quantityGms || 0
      );

      const isSameProductAndUnit =
        targetBusinessId === existing.businessId &&
        targetProductType === existing.productType &&
        targetQuantityUnit === existing.quantityUnit;

      if (isSameProductAndUnit) {
        const delta = newQtyDecimal.minus(oldQtyDecimal);

        if (delta.greaterThan(0)) {
          // Requires additional inventory
          const [lockedInv] = await tx.$queryRaw<
            Array<{
              id: string;
              remainingQuantity: Prisma.Decimal;
              averageCostPerUnitAED: Prisma.Decimal;
              totalSoldQuantity: Prisma.Decimal;
            }>
          >`
            SELECT id, "remainingQuantity", "averageCostPerUnitAED", "totalSoldQuantity"
            FROM "Inventory"
            WHERE "businessId" = ${targetBusinessId}
              AND "productType" = ${targetProductType}
              AND "quantityUnit" = ${targetQuantityUnit}::"QuantityUnit"
            FOR UPDATE
          `;

          const unitLabel = targetQuantityUnit === QuantityUnit.PIECE ? "PCS" : "GMS";
          const currentRemaining = lockedInv ? new Prisma.Decimal(lockedInv.remainingQuantity) : new Prisma.Decimal(0);

          if (!lockedInv || delta.greaterThan(currentRemaining)) {
            const availableTotal = currentRemaining.plus(oldQtyDecimal);
            throw new AuthError(
              `Only ${availableTotal.toString()} ${unitLabel} are available. You cannot sell ${newQtyDecimal.toString()} ${unitLabel}.`,
              400
            );
          }

          const newRemaining = currentRemaining.minus(delta);
          const newTotalSold = new Prisma.Decimal(lockedInv.totalSoldQuantity).plus(delta);
          const newCarryingValue = newRemaining
            .mul(new Prisma.Decimal(lockedInv.averageCostPerUnitAED))
            .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

          await tx.inventory.update({
            where: { id: lockedInv.id },
            data: {
              remainingQuantity: newRemaining,
              totalSoldQuantity: newTotalSold,
              carryingValueAED: newCarryingValue,
            },
          });
        } else if (delta.lessThan(0)) {
          // Releases inventory back
          const releaseQty = delta.abs();
          const inv = await tx.inventory.findUnique({
            where: {
              businessId_productType_quantityUnit: {
                businessId: targetBusinessId,
                productType: targetProductType,
                quantityUnit: targetQuantityUnit,
              },
            },
          });

          if (inv) {
            const newRemaining = new Prisma.Decimal(inv.remainingQuantity).plus(releaseQty);
            const newTotalSold = new Prisma.Decimal(inv.totalSoldQuantity).minus(releaseQty);
            const newCarryingValue = newRemaining
              .mul(new Prisma.Decimal(inv.averageCostPerUnitAED))
              .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                remainingQuantity: newRemaining,
                totalSoldQuantity: newTotalSold,
                carryingValueAED: newCarryingValue,
              },
            });
          }
        }
      } else {
        // Business, product, or unit changed: full reconciliation on both
        // Temporarily delete or bypass this sale in calculation
        await reconcileInventory(
          tx,
          existing.businessId,
          existing.productType,
          existing.quantityUnit || QuantityUnit.GRAM
        );

        // Lock new inventory
        const [lockedNewInv] = await tx.$queryRaw<
          Array<{
            id: string;
            remainingQuantity: Prisma.Decimal;
            averageCostPerUnitAED: Prisma.Decimal;
          }>
        >`
          SELECT id, "remainingQuantity", "averageCostPerUnitAED"
          FROM "Inventory"
          WHERE "businessId" = ${targetBusinessId}
            AND "productType" = ${targetProductType}
            AND "quantityUnit" = ${targetQuantityUnit}::"QuantityUnit"
          FOR UPDATE
        `;

        const unitLabel = targetQuantityUnit === QuantityUnit.PIECE ? "PCS" : "GMS";
        const newRemaining = lockedNewInv ? new Prisma.Decimal(lockedNewInv.remainingQuantity) : new Prisma.Decimal(0);

        if (!lockedNewInv || newQtyDecimal.greaterThan(newRemaining)) {
          throw new AuthError(
            `Only ${newRemaining.toString()} ${unitLabel} are available. You cannot sell ${newQtyDecimal.toString()} ${unitLabel}.`,
            400
          );
        }
      }

      // Recompute financial values
      const rawTotalSellingPriceINR =
        validated.totalSellingPriceINR !== undefined
          ? validated.totalSellingPriceINR
          : existing.totalSellingPriceINR || existing.inrRealizationValue;

      const inrRealizationDecimal = new Prisma.Decimal(rawTotalSellingPriceINR).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      );

      const rawFx =
        validated.realizedFxRate !== undefined
          ? validated.realizedFxRate
          : existing.realizedFxRate;

      const fxRateDecimal = new Prisma.Decimal(rawFx).toDecimalPlaces(
        4,
        Prisma.Decimal.ROUND_HALF_UP
      );

      const exactAedTotal = inrRealizationDecimal.div(fxRateDecimal);
      const aedEquivalentDecimal = exactAedTotal.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      const salesBasePriceDecimal = exactAedTotal
        .div(newQtyDecimal)
        .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          businessId: targetBusinessId,
          saleDate: validated.saleDate ? new Date(validated.saleDate) : undefined,
          liquidationDesk: validated.liquidationDesk?.trim(),
          buyerFirm: validated.buyerFirm?.trim(),
          productType: targetProductType.trim(),
          quantity: newQtyDecimal,
          quantityUnit: targetQuantityUnit,
          quantityGms: targetQuantityUnit === QuantityUnit.GRAM ? newQtyDecimal : null,
          sellingPricePerGm:
            targetQuantityUnit === QuantityUnit.GRAM ? salesBasePriceDecimal : null,
          basePricePerUnitAED: salesBasePriceDecimal,
          totalSellingPriceINR: inrRealizationDecimal,
          inrRealizationValue: inrRealizationDecimal,
          realizedFxRate: fxRateDecimal,
          aedEquivalent: aedEquivalentDecimal,
          status: validated.status,
        },
        include: { business: { select: { id: true, name: true, code: true } } },
      });

      // Final reconciliation to ensure exact numbers
      await reconcileInventory(tx, targetBusinessId, targetProductType, targetQuantityUnit);

      return updatedSale;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      timeout: 15000,
    }
  );

  await logAuditEvent({
    userId: session.userId,
    action: "SALE_UPDATED",
    entity: "Sale",
    entityId: updated.id,
    newValues: {
      status: updated.status,
      quantity: updated.quantity.toString(),
      totalSellingPriceINR: updated.totalSellingPriceINR?.toString(),
      aedEquivalent: updated.aedEquivalent.toString(),
    },
  });

  return updated;
}

/**
 * Mark a sale as finalized and CLEARED (locked).
 */
export async function clearSale(session: SessionPayload, saleId: string) {
  await requireResourceAccess("Sale", saleId, "WRITE", session);

  const cleared = await prisma.sale.update({
    where: { id: saleId },
    data: { status: SaleStatus.CLEARED },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "SALE_CLEARED_LOCKED",
    entity: "Sale",
    entityId: cleared.id,
  });

  return cleared;
}

/**
 * Delete a sale and restore inventory quantity.
 */
export async function deleteSale(session: SessionPayload, saleId: string) {
  const { resource: existing } = await requireResourceAccess<
    Prisma.SaleGetPayload<Record<string, never>>
  >("Sale", saleId, "DELETE", session);

  await prisma.$transaction(async (tx) => {
    await tx.sale.delete({
      where: { id: saleId },
    });

    await reconcileInventory(
      tx,
      existing.businessId,
      existing.productType,
      existing.quantityUnit || QuantityUnit.GRAM
    );
  });

  await logAuditEvent({
    userId: session.userId,
    action: "SALE_DELETED",
    entity: "Sale",
    entityId: saleId,
    oldValues: {
      saleCode: existing.saleCode,
      quantity: existing.quantity?.toString(),
      businessId: existing.businessId,
    },
  });

  return { success: true };
}
