-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "tier1MaxBaht" INTEGER NOT NULL DEFAULT 1000,
    "tier1Rate" REAL NOT NULL DEFAULT 0.05,
    "tier2MaxBaht" INTEGER NOT NULL DEFAULT 5000,
    "tier2Rate" REAL NOT NULL DEFAULT 0.04,
    "tier3Rate" REAL NOT NULL DEFAULT 0.03,
    "adminEmails" TEXT NOT NULL DEFAULT '',
    "lineId" TEXT,
    "instagramId" TEXT,
    "phoneNumber" TEXT,
    "updatedAt" DATETIME NOT NULL
);
