-- Prod-hardening (2026-09-15):
--   1. User.deviceSecret — bcrypt binding for guest/device self-heal proof.
--   2. SharedPlanItem.version — optimistic lock (CAS basis for PATCH).
--   3. CookShare — per-household, no-login cook link (token is the credential).
-- All changes additive + non-null-defaulted: existing rows are untouched.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deviceSecret" TEXT;

ALTER TABLE "SharedPlanItem" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "CookShare" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT 'Cook',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CookShare_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CookShare_householdId_key" ON "CookShare"("householdId");
CREATE UNIQUE INDEX IF NOT EXISTS "CookShare_token_key" ON "CookShare"("token");
CREATE INDEX IF NOT EXISTS "CookShare_householdId_idx" ON "CookShare"("householdId");

ALTER TABLE "CookShare" ADD CONSTRAINT "CookShare_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;