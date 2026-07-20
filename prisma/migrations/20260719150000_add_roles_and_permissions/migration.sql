-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FULL_ADMIN', 'EXECUTIVE_ADMIN', 'STAFF', 'VIP_USER', 'GENERAL_USER');

-- CreateEnum
CREATE TYPE "AdminPermission" AS ENUM ('MANAGE_USERS', 'RESOLVE_REPORTS', 'MARK_MATCHES_CALLED', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_SETTINGS', 'VIEW_STATS');

-- AlterEnum
ALTER TYPE "AdminActionType" ADD VALUE 'USER_ROLE_CHANGED';
ALTER TYPE "AdminActionType" ADD VALUE 'PERMISSIONS_UPDATED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'GENERAL_USER';

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permission" "AdminPermission" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_permission_key" ON "RolePermission"("role", "permission");

-- DataMigration: carry over the admins previously listed in
-- PlatformSettings.adminEmails to the new role column before that column
-- is dropped below.
UPDATE "User" SET "role" = 'FULL_ADMIN' WHERE lower("email") IN ('myzafira@gmail.com', 'bestcircle@gmail.com');

-- DataMigration: sensible starting permission grants for the two
-- configurable admin tiers — adjustable later via the permissions matrix.
INSERT INTO "RolePermission" ("id", "role", "permission", "granted") VALUES
  ('seed_exec_manage_users', 'EXECUTIVE_ADMIN', 'MANAGE_USERS', true),
  ('seed_exec_resolve_reports', 'EXECUTIVE_ADMIN', 'RESOLVE_REPORTS', true),
  ('seed_exec_mark_matches', 'EXECUTIVE_ADMIN', 'MARK_MATCHES_CALLED', true),
  ('seed_exec_manage_announcements', 'EXECUTIVE_ADMIN', 'MANAGE_ANNOUNCEMENTS', true),
  ('seed_exec_manage_settings', 'EXECUTIVE_ADMIN', 'MANAGE_SETTINGS', true),
  ('seed_exec_view_stats', 'EXECUTIVE_ADMIN', 'VIEW_STATS', true),
  ('seed_staff_resolve_reports', 'STAFF', 'RESOLVE_REPORTS', true),
  ('seed_staff_mark_matches', 'STAFF', 'MARK_MATCHES_CALLED', true),
  ('seed_staff_view_stats', 'STAFF', 'VIEW_STATS', true);

-- AlterTable
ALTER TABLE "PlatformSettings" DROP COLUMN "adminEmails";
