-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "faceValueCents" INTEGER;

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "maxResaleMarkupPercent" INTEGER NOT NULL DEFAULT 150;
