-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ROOT_ADMIN', 'PARTNER_RESTRICTED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TradingCycleStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'REALIZED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'CLEARED');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'CLEARED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('DELIVERY_FREIGHT', 'LABOUR_VAULT', 'PROCESSING_ASSAYING', 'INDIA_EXPENSE', 'TRANSFER_FX_FEES', 'GENERAL_OVERHEAD');

-- CreateEnum
CREATE TYPE "ExpensePaymentStatus" AS ENUM ('PENDING', 'CLEARED');

-- CreateEnum
CREATE TYPE "ProfitAllocationStatus" AS ENUM ('UNSETTLED', 'PARTIALLY_SETTLED', 'SETTLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CAPITAL_INWARD', 'PROFIT_DISBURSAL', 'CAPITAL_RETURN', 'OPERATIONAL_PAYMENT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('DIRECT_BANK_WIRE', 'ESCROW_TRANSFER', 'CASH_VAULT', 'CHEQUE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PARTNER_RESTRICTED',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "BusinessStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessUser" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "equitySharePct" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "defaultSharePct" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "businessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "committedAmount" DECIMAL(18,2) NOT NULL,
    "profitSharePct" DECIMAL(5,2) NOT NULL,
    "allocatedGrams" DECIMAL(18,3),
    "depositDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradingCycle" (
    "id" TEXT NOT NULL,
    "cycleCode" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "status" "TradingCycleStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "completionDate" TIMESTAMP(3),
    "grossRealizationAed" DECIMAL(18,2),
    "purchaseLandedCostAed" DECIMAL(18,2),
    "directExpensesAed" DECIMAL(18,2),
    "grossArbitrageSpreadAed" DECIMAL(18,2),
    "netProfitAed" DECIMAL(18,2),
    "investorShareTotalAed" DECIMAL(18,2),
    "deskRetainedProfitAed" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "purchaseCode" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tradingCycleId" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "sourcingVault" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "quantityGms" DECIMAL(18,3) NOT NULL,
    "basePricePerGm" DECIMAL(18,4) NOT NULL,
    "baseAcquisitionValue" DECIMAL(18,2) NOT NULL,
    "transitInsuranceFreight" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "vaultHandlingLabour" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "customsSecurity" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalLandedCost" DECIMAL(18,2) NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "saleCode" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tradingCycleId" TEXT,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "liquidationDesk" TEXT NOT NULL,
    "buyerFirm" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "quantityGms" DECIMAL(18,3) NOT NULL,
    "sellingPricePerGm" DECIMAL(18,4) NOT NULL,
    "inrRealizationValue" DECIMAL(18,2) NOT NULL,
    "realizedFxRate" DECIMAL(18,4) NOT NULL,
    "aedEquivalent" DECIMAL(18,2) NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "expenseCode" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tradingCycleId" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "refNo" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "status" "ExpensePaymentStatus" NOT NULL DEFAULT 'CLEARED',
    "isPurchaseLandedCost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfitAllocation" (
    "id" TEXT NOT NULL,
    "tradingCycleId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "investmentId" TEXT,
    "netCycleProfit" DECIMAL(18,2) NOT NULL,
    "contractRatio" DECIMAL(5,2) NOT NULL,
    "allocatedAmount" DECIMAL(18,2) NOT NULL,
    "status" "ProfitAllocationStatus" NOT NULL DEFAULT 'UNSETTLED',
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfitAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "transactionCode" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "investorId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "bankReference" TEXT,
    "escrowAccount" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Business_code_key" ON "Business"("code");

-- CreateIndex
CREATE INDEX "Business_code_idx" ON "Business"("code");

-- CreateIndex
CREATE INDEX "Business_status_idx" ON "Business"("status");

-- CreateIndex
CREATE INDEX "BusinessUser_businessId_idx" ON "BusinessUser"("businessId");

-- CreateIndex
CREATE INDEX "BusinessUser_userId_idx" ON "BusinessUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUser_businessId_userId_key" ON "BusinessUser"("businessId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Investor_code_key" ON "Investor"("code");

-- CreateIndex
CREATE INDEX "Investor_code_idx" ON "Investor"("code");

-- CreateIndex
CREATE INDEX "Investor_status_idx" ON "Investor"("status");

-- CreateIndex
CREATE INDEX "Investor_businessId_idx" ON "Investor"("businessId");

-- CreateIndex
CREATE INDEX "Investment_investorId_idx" ON "Investment"("investorId");

-- CreateIndex
CREATE INDEX "Investment_businessId_idx" ON "Investment"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "TradingCycle_cycleCode_key" ON "TradingCycle"("cycleCode");

-- CreateIndex
CREATE INDEX "TradingCycle_businessId_idx" ON "TradingCycle"("businessId");

-- CreateIndex
CREATE INDEX "TradingCycle_status_idx" ON "TradingCycle"("status");

-- CreateIndex
CREATE INDEX "TradingCycle_cycleCode_idx" ON "TradingCycle"("cycleCode");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_purchaseCode_key" ON "Purchase"("purchaseCode");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_tradingCycleId_key" ON "Purchase"("tradingCycleId");

-- CreateIndex
CREATE INDEX "Purchase_businessId_idx" ON "Purchase"("businessId");

-- CreateIndex
CREATE INDEX "Purchase_tradingCycleId_idx" ON "Purchase"("tradingCycleId");

-- CreateIndex
CREATE INDEX "Purchase_purchaseDate_idx" ON "Purchase"("purchaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_saleCode_key" ON "Sale"("saleCode");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_tradingCycleId_key" ON "Sale"("tradingCycleId");

-- CreateIndex
CREATE INDEX "Sale_businessId_idx" ON "Sale"("businessId");

-- CreateIndex
CREATE INDEX "Sale_tradingCycleId_idx" ON "Sale"("tradingCycleId");

-- CreateIndex
CREATE INDEX "Sale_saleDate_idx" ON "Sale"("saleDate");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_expenseCode_key" ON "Expense"("expenseCode");

-- CreateIndex
CREATE INDEX "Expense_businessId_idx" ON "Expense"("businessId");

-- CreateIndex
CREATE INDEX "Expense_tradingCycleId_idx" ON "Expense"("tradingCycleId");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "ProfitAllocation_tradingCycleId_idx" ON "ProfitAllocation"("tradingCycleId");

-- CreateIndex
CREATE INDEX "ProfitAllocation_investorId_idx" ON "ProfitAllocation"("investorId");

-- CreateIndex
CREATE INDEX "ProfitAllocation_status_idx" ON "ProfitAllocation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProfitAllocation_tradingCycleId_investorId_key" ON "ProfitAllocation"("tradingCycleId", "investorId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transactionCode_key" ON "Transaction"("transactionCode");

-- CreateIndex
CREATE INDEX "Transaction_businessId_idx" ON "Transaction"("businessId");

-- CreateIndex
CREATE INDEX "Transaction_investorId_idx" ON "Transaction"("investorId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- AddForeignKey
ALTER TABLE "BusinessUser" ADD CONSTRAINT "BusinessUser_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessUser" ADD CONSTRAINT "BusinessUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investor" ADD CONSTRAINT "Investor_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradingCycle" ADD CONSTRAINT "TradingCycle_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_tradingCycleId_fkey" FOREIGN KEY ("tradingCycleId") REFERENCES "TradingCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_tradingCycleId_fkey" FOREIGN KEY ("tradingCycleId") REFERENCES "TradingCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tradingCycleId_fkey" FOREIGN KEY ("tradingCycleId") REFERENCES "TradingCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitAllocation" ADD CONSTRAINT "ProfitAllocation_tradingCycleId_fkey" FOREIGN KEY ("tradingCycleId") REFERENCES "TradingCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitAllocation" ADD CONSTRAINT "ProfitAllocation_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitAllocation" ADD CONSTRAINT "ProfitAllocation_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
