-- AlterTable: add the new array column first, alongside the old one
ALTER TABLE "Listing" ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Data migration: carry forward any existing single image as a one-element array
UPDATE "Listing" SET "imageUrls" = ARRAY["imageUrl"] WHERE "imageUrl" IS NOT NULL;

-- AlterTable: now safe to drop the old column
ALTER TABLE "Listing" DROP COLUMN "imageUrl";
