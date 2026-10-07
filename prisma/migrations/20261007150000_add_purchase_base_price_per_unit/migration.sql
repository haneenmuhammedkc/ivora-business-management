-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN "basePricePerUnitAED" DECIMAL(18,4);

-- Backfill from basePricePerGm where available
UPDATE "Purchase"
SET "basePricePerUnitAED" = "basePricePerGm"
WHERE "basePricePerGm" IS NOT NULL AND "basePricePerUnitAED" IS NULL;
