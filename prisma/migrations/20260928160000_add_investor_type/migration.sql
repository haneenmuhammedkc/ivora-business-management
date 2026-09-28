-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "InvestorType" AS ENUM ('ADMIN', 'PARTNER', 'INVESTOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Investor" ADD COLUMN IF NOT EXISTS "type" "InvestorType" NOT NULL DEFAULT 'INVESTOR';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Investor_type_idx" ON "Investor"("type");
