-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "section" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceCents" INTEGER NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sellerId" TEXT NOT NULL,
    "fulfillsRequestId" TEXT,
    CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Listing_fulfillsRequestId_fkey" FOREIGN KEY ("fulfillsRequestId") REFERENCES "BuyRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("createdAt", "description", "eventDate", "eventName", "id", "priceCents", "quantity", "section", "sellerId", "status", "title", "updatedAt", "venue") SELECT "createdAt", "description", "eventDate", "eventName", "id", "priceCents", "quantity", "section", "sellerId", "status", "title", "updatedAt", "venue" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
