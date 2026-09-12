-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "mealSlot" TEXT NOT NULL,
    "eatenAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdPlanItem" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "mealSlot" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MealLog_userId_dishId_mealSlot_eatenAt_key" ON "MealLog"("userId", "dishId", "mealSlot", "eatenAt");

-- CreateIndex
CREATE INDEX "MealLog_userId_eatenAt_idx" ON "MealLog"("userId", "eatenAt");

-- CreateIndex
CREATE INDEX "MealLog_userId_idx" ON "MealLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdPlanItem_householdId_authorUserId_dishId_mealSlot_dayIndex_key" ON "HouseholdPlanItem"("householdId", "authorUserId", "dishId", "mealSlot", "dayIndex");

-- CreateIndex
CREATE INDEX "HouseholdPlanItem_householdId_authorUserId_idx" ON "HouseholdPlanItem"("householdId", "authorUserId");

-- CreateIndex
CREATE INDEX "HouseholdPlanItem_householdId_idx" ON "HouseholdPlanItem"("householdId");

-- AddForeignKey
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdPlanItem" ADD CONSTRAINT "HouseholdPlanItem_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdPlanItem" ADD CONSTRAINT "HouseholdPlanItem_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
