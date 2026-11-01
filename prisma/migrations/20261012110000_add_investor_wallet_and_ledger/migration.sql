-- CreateEnum
CREATE TYPE "WalletEntryType" AS ENUM ('INITIAL_DEPOSIT', 'INVESTMENT_ALLOCATION', 'CAPITAL_RETURN_CREDIT', 'PROFIT_CREDIT', 'WITHDRAWAL_DEBIT', 'WITHDRAWAL_REVERSAL', 'RECONCILIATION_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateTable
CREATE TABLE "InvestorWallet" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "availableBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "reservedBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorWalletEntry" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "entryCode" TEXT NOT NULL,
    "type" "WalletEntryType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "paymentMethod" "PaymentMethod",
    "businessId" TEXT,
    "investmentId" TEXT,
    "sourceTxId" TEXT,
    "withdrawalId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorWalletEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorWithdrawal" (
    "id" TEXT NOT NULL,
    "withdrawalCode" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "bankReference" TEXT,
    "notes" TEXT,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "processedById" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestorWallet_investorId_key" ON "InvestorWallet"("investorId");

-- CreateIndex
CREATE INDEX "InvestorWallet_investorId_idx" ON "InvestorWallet"("investorId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorWalletEntry_entryCode_key" ON "InvestorWalletEntry"("entryCode");

-- CreateIndex
CREATE INDEX "InvestorWalletEntry_walletId_idx" ON "InvestorWalletEntry"("walletId");

-- CreateIndex
CREATE INDEX "InvestorWalletEntry_type_idx" ON "InvestorWalletEntry"("type");

-- CreateIndex
CREATE INDEX "InvestorWalletEntry_createdAt_idx" ON "InvestorWalletEntry"("createdAt");

-- CreateIndex
CREATE INDEX "InvestorWalletEntry_businessId_idx" ON "InvestorWalletEntry"("businessId");

-- CreateIndex
CREATE INDEX "InvestorWalletEntry_investmentId_idx" ON "InvestorWalletEntry"("investmentId");

-- CreateIndex
CREATE INDEX "InvestorWalletEntry_withdrawalId_idx" ON "InvestorWalletEntry"("withdrawalId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorWalletEntry_sourceTxId_type_key" ON "InvestorWalletEntry"("sourceTxId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorWithdrawal_withdrawalCode_key" ON "InvestorWithdrawal"("withdrawalCode");

-- CreateIndex
CREATE INDEX "InvestorWithdrawal_walletId_idx" ON "InvestorWithdrawal"("walletId");

-- CreateIndex
CREATE INDEX "InvestorWithdrawal_investorId_idx" ON "InvestorWithdrawal"("investorId");

-- CreateIndex
CREATE INDEX "InvestorWithdrawal_status_idx" ON "InvestorWithdrawal"("status");

-- CreateIndex
CREATE INDEX "InvestorWithdrawal_createdAt_idx" ON "InvestorWithdrawal"("createdAt");

-- AddForeignKey
ALTER TABLE "InvestorWallet" ADD CONSTRAINT "InvestorWallet_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorWalletEntry" ADD CONSTRAINT "InvestorWalletEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "InvestorWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorWalletEntry" ADD CONSTRAINT "InvestorWalletEntry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorWalletEntry" ADD CONSTRAINT "InvestorWalletEntry_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorWalletEntry" ADD CONSTRAINT "InvestorWalletEntry_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "InvestorWithdrawal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorWithdrawal" ADD CONSTRAINT "InvestorWithdrawal_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "InvestorWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
