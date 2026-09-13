-- Taste personalization: canonical taste columns on BOTH preference tables
-- (DietPreference is authoritative; UserProfile is the legacy parity surface).
ALTER TABLE "UserProfile" ADD COLUMN "noveltyPreference" TEXT NOT NULL DEFAULT 'balanced';
ALTER TABLE "UserProfile" ADD COLUMN "cuisineAffinities" TEXT[];
ALTER TABLE "DietPreference" ADD COLUMN "noveltyPreference" TEXT NOT NULL DEFAULT 'balanced';
ALTER TABLE "DietPreference" ADD COLUMN "cuisineAffinities" TEXT[];

-- CreateTable: TasteLedger — the persisted learning record.
-- One row = one user action on one dish (like/dislike/replacedTo/added).
CREATE TABLE "TasteLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "replacedWithId" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TasteLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TasteLedger_userId_idx" ON "TasteLedger"("userId");

-- CreateIndex
CREATE INDEX "TasteLedger_dishId_idx" ON "TasteLedger"("dishId");

-- AddForeignKey
ALTER TABLE "TasteLedger" ADD CONSTRAINT "TasteLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
