-- CreateEnum
CREATE TYPE "QuantityUnit" AS ENUM ('GRAM', 'PIECE');

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "quantity" DECIMAL(18,3) NOT NULL,
ADD COLUMN     "quantityUnit" "QuantityUnit" NOT NULL DEFAULT 'GRAM',
ALTER COLUMN "sourcingVault" DROP NOT NULL,
ALTER COLUMN "quantityGms" DROP NOT NULL,
ALTER COLUMN "basePricePerGm" DROP NOT NULL,
ALTER COLUMN "baseAcquisitionValue" DROP NOT NULL,
ALTER COLUMN "transitInsuranceFreight" DROP NOT NULL,
ALTER COLUMN "vaultHandlingLabour" DROP NOT NULL,
ALTER COLUMN "customsSecurity" DROP NOT NULL,
ALTER COLUMN "totalLandedCost" DROP NOT NULL;
