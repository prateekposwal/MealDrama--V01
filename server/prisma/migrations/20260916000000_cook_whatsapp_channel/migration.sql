-- Cook WhatsApp channel (2026-09-16): the cook's ONLY channel is WhatsApp
-- Business API. Extends CookShare (created 2026-09-15) with the messaging
-- config: E.164 send target, daily-push opt-in, local send time + timezone,
-- message language, idempotent last-sent marker, and the explicit cook
-- consent timestamp. All additive + non-null-defaulted: existing rows stay
-- untouched and send NOTHING until notifyEnabled flips to true.

ALTER TABLE "CookShare" ADD COLUMN IF NOT EXISTS "cookPhone" TEXT;
ALTER TABLE "CookShare" ADD COLUMN IF NOT EXISTS "notifyEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CookShare" ADD COLUMN IF NOT EXISTS "notifyAt" TEXT NOT NULL DEFAULT '08:00';
ALTER TABLE "CookShare" ADD COLUMN IF NOT EXISTS "notifyTz" TEXT NOT NULL DEFAULT 'Asia/Kolkata';
ALTER TABLE "CookShare" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'hi';
ALTER TABLE "CookShare" ADD COLUMN IF NOT EXISTS "lastSentDate" TEXT;
ALTER TABLE "CookShare" ADD COLUMN IF NOT EXISTS "consentAt" TIMESTAMP(3);