import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess } from "@/lib/auth/authorization";
import { AuthError } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, QuantityUnit, SaleStatus, PurchaseStatus, UserRole, BusinessStatus } from "@prisma/client";
import { getOrSetCache } from "@/lib/redis/cache";
import { CacheKeys, CacheTTL } from "@/lib/redis/keys";
import { invalidateTransactionCaches } from "@/lib/redis/invalidation";
import {
  getBusinessInventoryLiquidationStatus,
  getBusinessClosureEligibility,
  closeBusinessAndExecuteFinalSettlement,
} from "@/services/business/business.service";
import {
  createSaleSchema,
  updateSaleSchema,
} from "@/validators/sale.validator";

export interface CreateSaleInput {
  businessId: string;
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
 * Respects status rules: Purchase IN [CLEARED, IN_PROGRESS], Sale IN [CLEARED, PENDING].
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
      productType: { equals: productType.trim(), mode: "insensitive" },
      quantityUnit,
      status: { in: [PurchaseStatus.CLEARED, PurchaseStatus.IN_PROGRESS] },
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
      productType: { equals: productType.trim(), mode: "insensitive" },
      quantityUnit,
      status: { in: [SaleStatus.CLEARED, SaleStatus.PENDING] },
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
 * Calculates authoritative commodity-specific inventory availability.
 * Available Quantity = Total Purchased - Total Sold (excluding specified saleId if updating).
 * Respects status rules: Purchase IN [CLEARED, IN_PROGRESS], Sale IN [CLEARED, PENDING].
 */
export async function getCommodityInventoryAvailability(
  tx: Prisma.TransactionClient,
  businessId: string,
  productType: string,
  quantityUnit: QuantityUnit,
  excludeSaleId?: string
): Promise<{
  productType: string;
  quantityUnit: QuantityUnit;
  totalPurchasedQuantity: Prisma.Decimal;
  alreadySoldQuantity: Prisma.Decimal;
  availableQuantity: Prisma.Decimal;
}> {
  const purchases = await tx.purchase.findMany({
    where: {
      businessId,
      productType: { equals: productType.trim(), mode: "insensitive" },
      quantityUnit,
      status: { in: [PurchaseStatus.CLEARED, PurchaseStatus.IN_PROGRESS] },
    },
    select: { quantity: true },
  });

  const totalPurchased = purchases.reduce(
    (acc, p) => acc.plus(new Prisma.Decimal(p.quantity || 0)),
    new Prisma.Decimal(0)
  );

  const sales = await tx.sale.findMany({
    where: {
      businessId,
      productType: { equals: productType.trim(), mode: "insensitive" },
      quantityUnit,
      id: excludeSaleId ? { not: excludeSaleId } : undefined,
      status: { in: [SaleStatus.CLEARED, SaleStatus.PENDING] },
    },
    select: { quantity: true },
  });

  const alreadySold = sales.reduce(
    (acc, s) => acc.plus(new Prisma.Decimal(s.quantity || 0)),
    new Prisma.Decimal(0)
  );

  const available = totalPurchased.minus(alreadySold);

  return {
    productType,
    quantityUnit,
    totalPurchasedQuantity: totalPurchased,
    alreadySoldQuantity: alreadySold,
    availableQuantity: available,
  };
}

/**
 * Returns available products with remaining inventory for an assigned Business.
 * Sorted by newest purchase activity first.
 */
export async function getAvailableProductsForBusiness(
  session: SessionPayload,
  businessId: string,
  includeProductType?: string
) {
  await requireBusinessAccess(businessId, session);

  // Find all distinct product types and units purchased for this business
  const distinctProducts = await prisma.purchase.findMany({
    where: {
      businessId,
      status: { in: [PurchaseStatus.CLEARED, PurchaseStatus.IN_PROGRESS] },
    },
    select: {
      productType: true,
      quantityUnit: true,
    },
    distinct: ["productType", "quantityUnit"],
  });

  const results: Array<{
    productType: string;
    quantityUnit: QuantityUnit;
    totalPurchasedQuantity: number;
    totalSoldQuantity: number;
    remainingQuantity: number;
    averageCostPerUnitAED: number;
    lastPurchaseDate: string | null;
  }> = [];

  for (const item of distinctProducts) {
    const inv = await prisma.$transaction(async (tx) => {
      return reconcileInventory(tx, businessId, item.productType, item.quantityUnit);
    });

    const isMatchInclude =
      includeProductType &&
      inv.productType.trim().toLowerCase() === includeProductType.trim().toLowerCase();

    if (Number(inv.remainingQuantity) > 0 || isMatchInclude) {
      results.push({
        productType: inv.productType,
        quantityUnit: inv.quantityUnit,
        totalPurchasedQuantity: Number(inv.totalPurchasedQuantity),
        totalSoldQuantity: Number(inv.totalSoldQuantity),
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
    const cacheKey = CacheKeys.sales.list(businessId);
    return getOrSetCache(cacheKey, CacheTTL.MEDIUM, () =>
      prisma.sale.findMany({
        where: { businessId },
        include: { business: { select: { id: true, name: true, code: true } } },
        orderBy: { saleDate: "desc" },
      })
    );
  }

  const cacheKey = CacheKeys.sales.list(undefined, session.role, session.userId);
  const where: Prisma.SaleWhereInput =
    session.role === UserRole.ADMIN
      ? {}
      : { business: { partnerId: session.userId } };

  return getOrSetCache(cacheKey, CacheTTL.MEDIUM, () =>
    prisma.sale.findMany({
      where,
      include: { business: { select: { id: true, name: true, code: true } } },
      orderBy: { saleDate: "desc" },
    })
  );
}

/**
 * Get a single sale by ID with access control.
 */
export async function getSaleById(session: SessionPayload, saleId: string) {
  const { resource } = await requireResourceAccess("Sale", saleId, "READ", session);
  return resource;
}

export interface AutomaticClosureOutcome {
  attempted: boolean;
  succeeded: boolean;
  businessStatus?: BusinessStatus;
  reasons?: string[];
  error?: string;
  isAutomated?: boolean;
}

/**
 * Checks if all inventory across all products in the business is liquidated.
 * If zero remaining inventory across all products and closure eligibility conditions pass,
 * automatically executes business closure and final settlement.
 */
export async function triggerAutomaticBusinessClosureIfEligible(
  session: SessionPayload,
  businessId: string
): Promise<AutomaticClosureOutcome> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, code: true, name: true, status: true },
    });

    if (!business) {
      return { attempted: false, succeeded: false, error: "Business not found" };
    }

    if (business.status === BusinessStatus.SETTLED || business.status === BusinessStatus.INACTIVE) {
      return {
        attempted: false,
        succeeded: true,
        businessStatus: business.status,
      };
    }

    // 1. Confirm complete inventory liquidation across ALL products
    const liquidation = await getBusinessInventoryLiquidationStatus(businessId);
    if (!liquidation.isLiquidated || liquidation.totalUnsoldQuantity > 0 || liquidation.unsoldInventory.length > 0) {
      return {
        attempted: false,
        succeeded: false,
        businessStatus: business.status,
        reasons: [`Business still has remaining unsold inventory across ${liquidation.unsoldInventory.length} product(s).`],
      };
    }

    // 2. Validate all closure prerequisites (no pending expenses, valid sales recognition, etc.)
    const eligibility = await getBusinessClosureEligibility(session, businessId);
    if (!eligibility.isEligible) {
      await logAuditEvent({
        userId: session.userId,
        action: "BUSINESS_AUTO_CLOSURE_SKIPPED",
        entity: "Business",
        entityId: businessId,
        newValues: {
          businessCode: business.code,
          reasons: eligibility.reasons,
        },
      });

      return {
        attempted: true,
        succeeded: false,
        businessStatus: business.status,
        reasons: eligibility.reasons,
      };
    }

    // 3. All prerequisites met: Execute final closure & settlement
    const closureResult = await closeBusinessAndExecuteFinalSettlement(session, businessId, { isAutomated: true });

    return {
      attempted: true,
      succeeded: closureResult.success,
      businessStatus: BusinessStatus.SETTLED,
      isAutomated: true,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Automatic Business Closure Error for ${businessId}]:`, errorMsg);

    await logAuditEvent({
      userId: session.userId,
      action: "BUSINESS_AUTO_CLOSURE_FAILED",
      entity: "Business",
      entityId: businessId,
      newValues: {
        error: errorMsg,
      },
    });

    return {
      attempted: true,
      succeeded: false,
      error: errorMsg,
    };
  }
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
  await requireBusinessAccess(validated.businessId, session, "WRITE");

  // 3. Atomic Database Transaction
  const sale = await prisma.$transaction(
    async (tx) => {
      // Step 0: Ensure business is active and not already closed
      const currentBiz = await tx.business.findUnique({
        where: { id: validated.businessId },
        select: { status: true },
      });
      if (currentBiz?.status === BusinessStatus.SETTLED) {
        throw new AuthError("Cannot record sales for a closed and settled business.", 400);
      }

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
      await tx.$queryRaw`
        SELECT id
        FROM "Inventory"
        WHERE "businessId" = ${validated.businessId}
          AND "productType" = ${validated.productType}
          AND "quantityUnit" = ${validated.quantityUnit}::"QuantityUnit"
        FOR UPDATE
      `;

      // Step C: Authoritative Commodity Inventory Validation
      const availability = await getCommodityInventoryAvailability(
        tx,
        validated.businessId,
        validated.productType,
        validated.quantityUnit
      );

      const unitSuffix = validated.quantityUnit === QuantityUnit.PIECE ? " pcs" : "g";
      const saleQtyDecimal = new Prisma.Decimal(validated.quantity);

      if (availability.totalPurchasedQuantity.lte(0)) {
        throw new AuthError(
          `No inventory found for commodity "${validated.productType}". This business has no recorded purchases for this commodity.`,
          400,
          {
            productType: validated.productType,
            purchasedQuantity: 0,
            alreadySoldQuantity: 0,
            availableQuantity: 0,
            requestedQuantity: Number(saleQtyDecimal.toFixed(3)),
          }
        );
      }

      if (saleQtyDecimal.greaterThan(availability.availableQuantity)) {
        const availNum = Math.max(0, Number(availability.availableQuantity.toFixed(3)));
        throw new AuthError(
          `Insufficient ${validated.productType} inventory. Available quantity: ${availNum}${unitSuffix}.`,
          400,
          {
            productType: validated.productType,
            purchasedQuantity: Number(availability.totalPurchasedQuantity.toFixed(3)),
            alreadySoldQuantity: Number(availability.alreadySoldQuantity.toFixed(3)),
            availableQuantity: availNum,
            requestedQuantity: Number(saleQtyDecimal.toFixed(3)),
          }
        );
      }

      // Step D: Authoritative Financial Arithmetic
      const inrRealizationDecimal = new Prisma.Decimal(validated.totalSellingPriceINR).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      );
      const fxRateDecimal = new Prisma.Decimal(validated.realizedFxRate);

      if (fxRateDecimal.lte(0)) {
        throw new AuthError("Conversion rate must be greater than zero", 400);
      }

      // AED Equivalent Realized = Total Selling Price (INR) × Conversion Rate (AED per INR)
      const exactAedTotal = inrRealizationDecimal.mul(fxRateDecimal);
      const aedEquivalentDecimal = exactAedTotal.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      // SALES BASE PRICE = AED Equivalent Realized ÷ Quantity
      const salesBasePriceDecimal = exactAedTotal
        .div(saleQtyDecimal)
        .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

      // Step E: Auto-generate Sale Code if missing
      const saleCode = validated.saleCode || (await generateUniqueSaleCode(tx));

      // Step F: Create Sale Record
      const createdSale = await tx.sale.create({
        data: {
          saleCode,
          businessId: validated.businessId,
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

      // Step G: Reconcile Inventory to update aggregate metrics
      await reconcileInventory(tx, createdSale.businessId, createdSale.productType, createdSale.quantityUnit);

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

  // Invalidate Redis caches
  await invalidateTransactionCaches(sale.businessId, "sales", sale.id);

  // Check and trigger automated business closure if all inventory is liquidated across all products
  const closureOutcome = await triggerAutomaticBusinessClosureIfEligible(session, sale.businessId);

  return {
    ...sale,
    automaticClosure: closureOutcome,
  };
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
      // Step 0: Ensure business is active and not already closed
      const currentBiz = await tx.business.findUnique({
        where: { id: existing.businessId },
        select: { status: true },
      });
      if (currentBiz?.status === BusinessStatus.SETTLED) {
        throw new AuthError("Cannot modify sales for a closed and settled business.", 400);
      }

      const targetBusinessId = validated.businessId || existing.businessId;
      const targetProductType = validated.productType || existing.productType;
      const targetQuantityUnit =
        validated.quantityUnit || existing.quantityUnit || QuantityUnit.GRAM;

      if (validated.businessId && validated.businessId !== existing.businessId) {
        await requireBusinessAccess(validated.businessId, session, "WRITE");
      }

      const newQtyDecimal =
        validated.quantity !== undefined
          ? new Prisma.Decimal(validated.quantity)
          : new Prisma.Decimal(existing.quantity || existing.quantityGms || 0);

      // Step A: Ensure target inventory record exists
      let targetInv = await tx.inventory.findUnique({
        where: {
          businessId_productType_quantityUnit: {
            businessId: targetBusinessId,
            productType: targetProductType,
            quantityUnit: targetQuantityUnit,
          },
        },
      });

      if (!targetInv) {
        targetInv = await reconcileInventory(
          tx,
          targetBusinessId,
          targetProductType,
          targetQuantityUnit
        );
      }

      // Step B: Concurrency Lock on target inventory
      await tx.$queryRaw`
        SELECT id
        FROM "Inventory"
        WHERE "businessId" = ${targetBusinessId}
          AND "productType" = ${targetProductType}
          AND "quantityUnit" = ${targetQuantityUnit}::"QuantityUnit"
        FOR UPDATE
      `;

      // Step C: Authoritative Commodity Inventory Validation excluding this sale
      const availability = await getCommodityInventoryAvailability(
        tx,
        targetBusinessId,
        targetProductType,
        targetQuantityUnit,
        saleId
      );

      const unitSuffix = targetQuantityUnit === QuantityUnit.PIECE ? " pcs" : "g";

      if (availability.totalPurchasedQuantity.lte(0)) {
        throw new AuthError(
          `No inventory found for commodity "${targetProductType}". This business has no recorded purchases for this commodity.`,
          400,
          {
            productType: targetProductType,
            purchasedQuantity: 0,
            alreadySoldQuantity: 0,
            availableQuantity: 0,
            requestedQuantity: Number(newQtyDecimal.toFixed(3)),
          }
        );
      }

      if (newQtyDecimal.greaterThan(availability.availableQuantity)) {
        const availNum = Math.max(0, Number(availability.availableQuantity.toFixed(3)));
        throw new AuthError(
          `Insufficient ${targetProductType} inventory. Available quantity: ${availNum}${unitSuffix}.`,
          400,
          {
            productType: targetProductType,
            purchasedQuantity: Number(availability.totalPurchasedQuantity.toFixed(3)),
            alreadySoldQuantity: Number(availability.alreadySoldQuantity.toFixed(3)),
            availableQuantity: availNum,
            requestedQuantity: Number(newQtyDecimal.toFixed(3)),
          }
        );
      }

      // Step D: Recompute financial values
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

      const fxRateDecimal = new Prisma.Decimal(rawFx);

      if (fxRateDecimal.lte(0)) {
        throw new AuthError("Conversion rate must be greater than zero", 400);
      }

      // Historical compatibility:
      // If updating a historical sale where realizedFxRate was entered under legacy division (rate >= 1)
      // and the user did NOT supply a new rate in this update, preserve legacy division for that rate.
      // If a new rate was provided or the rate is a conversion rate (rate < 1), use multiplication:
      let exactAedTotal: Prisma.Decimal;
      if (validated.realizedFxRate === undefined && fxRateDecimal.gte(1)) {
        exactAedTotal = inrRealizationDecimal.div(fxRateDecimal);
      } else {
        exactAedTotal = inrRealizationDecimal.mul(fxRateDecimal);
      }

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

      // Step E: Reconcile inventory for target and existing if changed
      await reconcileInventory(tx, targetBusinessId, targetProductType, targetQuantityUnit);
      if (
        existing.businessId !== targetBusinessId ||
        existing.productType !== targetProductType ||
        existing.quantityUnit !== targetQuantityUnit
      ) {
        await reconcileInventory(
          tx,
          existing.businessId,
          existing.productType,
          existing.quantityUnit || QuantityUnit.GRAM
        );
      }

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

  // Invalidate Redis caches
  await invalidateTransactionCaches(updated.businessId, "sales", updated.id);

  // Check and trigger automated business closure if all inventory is liquidated across all products
  const closureOutcome = await triggerAutomaticBusinessClosureIfEligible(session, updated.businessId);

  return {
    ...updated,
    automaticClosure: closureOutcome,
  };
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

  // Invalidate Redis caches
  await invalidateTransactionCaches(cleared.businessId, "sales", cleared.id);

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
    // Step 0: Ensure business is active and not already closed
    const currentBiz = await tx.business.findUnique({
      where: { id: existing.businessId },
      select: { status: true },
    });
    if (currentBiz?.status === BusinessStatus.SETTLED) {
      throw new AuthError("Cannot delete sales for a closed and settled business.", 400);
    }

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

  // Invalidate Redis caches
  await invalidateTransactionCaches(existing.businessId, "sales", saleId);

  return { success: true };
}
