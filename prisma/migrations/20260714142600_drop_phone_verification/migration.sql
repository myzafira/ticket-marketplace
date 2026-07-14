-- Drop phone verification columns (SMS verification removed; email-only now)
ALTER TABLE "User" DROP COLUMN IF EXISTS "phoneVerified";
ALTER TABLE "User" DROP COLUMN IF EXISTS "phoneVerifyCode";
ALTER TABLE "User" DROP COLUMN IF EXISTS "phoneVerifyExpiresAt";
