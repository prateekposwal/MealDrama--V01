-- CreateTable
CREATE TABLE "DietPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dietType" TEXT NOT NULL DEFAULT 'veg',
    "region" TEXT NOT NULL DEFAULT 'north',
    "allergies" TEXT[],
    "dislikedItems" TEXT[],
    "spiceLevel" TEXT NOT NULL DEFAULT 'medium',
    "healthGoal" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DietPreference_userId_key" ON "DietPreference"("userId");

-- CreateIndex
CREATE INDEX "DietPreference_userId_idx" ON "DietPreference"("userId");

-- AddForeignKey
ALTER TABLE "DietPreference" ADD CONSTRAINT "DietPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
