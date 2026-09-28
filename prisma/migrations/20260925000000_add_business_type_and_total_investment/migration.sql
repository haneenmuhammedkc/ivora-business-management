-- AlterTable
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "businessType" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "totalInvestmentAED" DECIMAL(18,2);

-- Ensure non-nullability if populated
ALTER TABLE "Business" ALTER COLUMN "businessType" SET NOT NULL;
ALTER TABLE "Business" ALTER COLUMN "totalInvestmentAED" SET NOT NULL;

-- Remove any default constraints so new inserts must supply them explicitly
ALTER TABLE "Business" ALTER COLUMN "businessType" DROP DEFAULT;
ALTER TABLE "Business" ALTER COLUMN "totalInvestmentAED" DROP DEFAULT;
