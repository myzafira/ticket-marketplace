-- CreateEnum
CREATE TYPE "ListingReportStatus" AS ENUM ('OPEN', 'RESOLVED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "feeDiscountPercent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "trustedSellerFeeDiscountPercent" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "trustedSellerMinSales" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "ListingReport" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ListingReportStatus" NOT NULL DEFAULT 'OPEN',
    "listingId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ListingReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingReport_listingId_reporterId_status_key" ON "ListingReport"("listingId", "reporterId", "status");

-- AddForeignKey
ALTER TABLE "ListingReport" ADD CONSTRAINT "ListingReport_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingReport" ADD CONSTRAINT "ListingReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
