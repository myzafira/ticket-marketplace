-- CreateTable
CREATE TABLE "BuyRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventName" TEXT NOT NULL,
    "venue" TEXT,
    "eventDate" DATETIME NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "maxPriceCents" INTEGER NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "buyerId" TEXT NOT NULL,
    CONSTRAINT "BuyRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
