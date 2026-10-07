-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_tradingCycleId_fkey";

-- DropForeignKey
ALTER TABLE "ProfitAllocation" DROP CONSTRAINT IF EXISTS "ProfitAllocation_investmentId_fkey";

-- DropForeignKey
ALTER TABLE "ProfitAllocation" DROP CONSTRAINT IF EXISTS "ProfitAllocation_investorId_fkey";

-- DropForeignKey
ALTER TABLE "ProfitAllocation" DROP CONSTRAINT IF EXISTS "ProfitAllocation_tradingCycleId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT IF EXISTS "Purchase_tradingCycleId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_tradingCycleId_fkey";

-- DropForeignKey
ALTER TABLE "TradingCycle" DROP CONSTRAINT IF EXISTS "TradingCycle_businessId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Expense_tradingCycleId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Purchase_tradingCycleId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Purchase_tradingCycleId_key";

-- DropIndex
DROP INDEX IF EXISTS "Sale_tradingCycleId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Sale_tradingCycleId_key";

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN IF EXISTS "tradingCycleId";

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN IF EXISTS "tradingCycleId";

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN IF EXISTS "tradingCycleId";

-- DropTable
DROP TABLE IF EXISTS "ProfitAllocation";

-- DropTable
DROP TABLE IF EXISTS "TradingCycle";

-- DropEnum
DROP TYPE IF EXISTS "ProfitAllocationStatus";

-- DropEnum
DROP TYPE IF EXISTS "TradingCycleStatus";
