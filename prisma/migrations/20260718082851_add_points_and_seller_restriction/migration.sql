-- CreateEnum
CREATE TYPE "PointsTransactionReason" AS ENUM ('EARNED_PURCHASE', 'EARNED_SALE', 'REDEEMED_FEE_DISCOUNT', 'ADMIN_ADJUSTMENT');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "pointsEarnedByBuyer" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pointsEarnedBySeller" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pointsRedeemedBySeller" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "pointsEarnRatePercent" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "sellerReportWarningThreshold" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "listingRestrictedAt" TIMESTAMP(3),
ADD COLUMN     "pointsBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" "PointsTransactionReason" NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
