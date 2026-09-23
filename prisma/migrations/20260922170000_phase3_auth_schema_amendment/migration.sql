-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('ACCOUNT_ACTIVATION', 'PASSWORD_RESET');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'PARTNER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PARTNER';
COMMIT;

-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'PENDING_ACTIVATION';

-- DropForeignKey
ALTER TABLE "BusinessUser" DROP CONSTRAINT "BusinessUser_businessId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessUser" DROP CONSTRAINT "BusinessUser_userId_fkey";

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "partnerEquityPct" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "partnerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ALTER COLUMN "role" SET DEFAULT 'PARTNER';

-- DropTable
DROP TABLE "BusinessUser";

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthToken_email_idx" ON "AuthToken"("email");

-- CreateIndex
CREATE INDEX "AuthToken_type_idx" ON "AuthToken"("type");

-- CreateIndex
CREATE INDEX "AuthToken_expiresAt_idx" ON "AuthToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Business_partnerId_idx" ON "Business"("partnerId");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
