-- CreateTable
CREATE TABLE "TraySlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "slot" TEXT NOT NULL,
    "totalServings" INTEGER NOT NULL DEFAULT 1,
    "guestCount" INTEGER NOT NULL DEFAULT 0,
    "guestDays" INTEGER NOT NULL DEFAULT 0,
    "isGuestMode" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TraySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrayItem" (
    "id" TEXT NOT NULL,
    "traySlotId" TEXT NOT NULL,
    "mealId" TEXT,
    "customDishId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "gravyStyle" TEXT NOT NULL DEFAULT 'Default',
    "rotiType" TEXT NOT NULL DEFAULT 'Phulka',
    "riceType" TEXT NOT NULL DEFAULT 'Plain',
    "sides" TEXT[],
    "beverages" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrayItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDish" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dietType" TEXT NOT NULL DEFAULT 'veg',
    "isCustom" BOOLEAN NOT NULL DEFAULT true,
    "defaultGravy" TEXT NOT NULL DEFAULT 'Default',
    "defaultRoti" TEXT NOT NULL DEFAULT 'Phulka',
    "defaultRice" TEXT NOT NULL DEFAULT 'Plain',
    "prepMinutes" INTEGER NOT NULL DEFAULT 30,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomDish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDishIngredient" (
    "id" TEXT NOT NULL,
    "customDishId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "CustomDishIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoommateLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "RoommateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoommateSuggestion" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "traySlotId" TEXT NOT NULL,
    "trayItemId" TEXT,
    "mealName" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "slot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "gravyStyle" TEXT,
    "rotiType" TEXT,
    "riceType" TEXT,
    "sides" TEXT[],
    "beverages" TEXT[],
    "roommateName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoommateSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TraySlot_userId_date_slot_key" ON "TraySlot"("userId", "date", "slot");

-- CreateIndex
CREATE INDEX "TraySlot_userId_date_idx" ON "TraySlot"("userId", "date");

-- CreateIndex
CREATE INDEX "TraySlot_userId_idx" ON "TraySlot"("userId");

-- CreateIndex
CREATE INDEX "TrayItem_traySlotId_idx" ON "TrayItem"("traySlotId");

-- CreateIndex
CREATE INDEX "TrayItem_mealId_idx" ON "TrayItem"("mealId");

-- CreateIndex
CREATE INDEX "TrayItem_customDishId_idx" ON "TrayItem"("customDishId");

-- CreateIndex
CREATE INDEX "CustomDish_userId_idx" ON "CustomDish"("userId");

-- CreateIndex
CREATE INDEX "CustomDish_userId_category_idx" ON "CustomDish"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "CustomDish_userId_name_key" ON "CustomDish"("userId", "name");

-- CreateIndex
CREATE INDEX "CustomDishIngredient_customDishId_idx" ON "CustomDishIngredient"("customDishId");

-- CreateIndex
CREATE INDEX "RoommateLink_userId_idx" ON "RoommateLink"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoommateLink_token_key" ON "RoommateLink"("token");

-- CreateIndex
CREATE INDEX "RoommateLink_token_idx" ON "RoommateLink"("token");

-- CreateIndex
CREATE INDEX "RoommateLink_expiresAt_idx" ON "RoommateLink"("expiresAt");

-- CreateIndex
CREATE INDEX "RoommateSuggestion_linkId_idx" ON "RoommateSuggestion"("linkId");

-- CreateIndex
CREATE INDEX "RoommateSuggestion_traySlotId_idx" ON "RoommateSuggestion"("traySlotId");

-- CreateIndex
CREATE INDEX "RoommateSuggestion_status_idx" ON "RoommateSuggestion"("status");

-- CreateIndex
CREATE INDEX "RoommateSuggestion_date_idx" ON "RoommateSuggestion"("date");

-- AddForeignKey
ALTER TABLE "TraySlot" ADD CONSTRAINT "TraySlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrayItem" ADD CONSTRAINT "TrayItem_traySlotId_fkey" FOREIGN KEY ("traySlotId") REFERENCES "TraySlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrayItem" ADD CONSTRAINT "TrayItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrayItem" ADD CONSTRAINT "TrayItem_customDishId_fkey" FOREIGN KEY ("customDishId") REFERENCES "CustomDish"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDish" ADD CONSTRAINT "CustomDish_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDishIngredient" ADD CONSTRAINT "CustomDishIngredient_customDishId_fkey" FOREIGN KEY ("customDishId") REFERENCES "CustomDish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateLink" ADD CONSTRAINT "RoommateLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateSuggestion" ADD CONSTRAINT "RoommateSuggestion_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "RoommateLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateSuggestion" ADD CONSTRAINT "RoommateSuggestion_traySlotId_fkey" FOREIGN KEY ("traySlotId") REFERENCES "TraySlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateSuggestion" ADD CONSTRAINT "RoommateSuggestion_trayItemId_fkey" FOREIGN KEY ("trayItemId") REFERENCES "TrayItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
