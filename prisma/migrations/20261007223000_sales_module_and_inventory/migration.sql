-- AlterTable Sale
ALTER TABLE "Sale" ADD COLUMN "quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
ADD COLUMN "quantityUnit" "QuantityUnit" NOT NULL DEFAULT 'GRAM',
ADD COLUMN "basePricePerUnitAED" DECIMAL(18,4),
ADD COLUMN "totalSellingPriceINR" DECIMAL(18,2),
ALTER COLUMN "liquidationDesk" DROP NOT NULL,
ALTER COLUMN "quantityGms" DROP NOT NULL,
ALTER COLUMN "sellingPricePerGm" DROP NOT NULL;

-- Backfill existing sales if any
UPDATE "Sale"
SET "quantity" = "quantityGms",
    "totalSellingPriceINR" = "inrRealizationValue"
WHERE "quantity" = 0 AND "quantityGms" IS NOT NULL;

CREATE INDEX "Sale_productType_idx" ON "Sale"("productType");

-- CreateTable Inventory
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "quantityUnit" "QuantityUnit" NOT NULL DEFAULT 'GRAM',
    "totalPurchasedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "totalSoldQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "remainingQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "totalCostAED" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "carryingValueAED" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "averageCostPerUnitAED" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "lastPurchaseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Inventory_businessId_productType_quantityUnit_key" ON "Inventory"("businessId", "productType", "quantityUnit");
CREATE INDEX "Inventory_businessId_idx" ON "Inventory"("businessId");
CREATE INDEX "Inventory_productType_idx" ON "Inventory"("productType");

ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
