-- AlterTable
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "adminInvestmentAED" DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "partnerInvestmentAED" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- Remove default constraints so future inserts must supply values explicitly
ALTER TABLE "Business" ALTER COLUMN "adminInvestmentAED" DROP DEFAULT;
ALTER TABLE "Business" ALTER COLUMN "partnerInvestmentAED" DROP DEFAULT;
