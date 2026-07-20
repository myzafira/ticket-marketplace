-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "vipEarlyAccessUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "ticketProofCode" TEXT,
ADD COLUMN     "vipFeeDiscountPercent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "vipEarlyAccessMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "vipFeeDiscountPercent" INTEGER NOT NULL DEFAULT 10;
