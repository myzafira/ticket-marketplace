-- CreateEnum
CREATE TYPE "OrderReportReason" AS ENUM ('TICKET_NOT_RECEIVED', 'WRONG_OR_INVALID_TICKET', 'PAYMENT_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderReportStatus" AS ENUM ('OPEN', 'RESOLVED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "ticketProofUrl" TEXT;

-- CreateTable
CREATE TABLE "OrderReport" (
    "id" TEXT NOT NULL,
    "reason" "OrderReportReason" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "OrderReportStatus" NOT NULL DEFAULT 'OPEN',
    "orderId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "OrderReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderReport_orderId_reporterId_status_key" ON "OrderReport"("orderId", "reporterId", "status");

-- AddForeignKey
ALTER TABLE "OrderReport" ADD CONSTRAINT "OrderReport_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReport" ADD CONSTRAINT "OrderReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
