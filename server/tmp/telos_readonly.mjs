import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const meals = await p.meal.count();
const users = await p.user.count();
const trayItems = await p.trayItem.count();
const traySlots = await p.traySlot.count();
const sample = await p.meal.findMany({ take: 20, select: { id: true } });
const fkCheck = await p.$queryRawUnsafe(
  `SELECT conname FROM pg_constraint WHERE conname = 'TrayItem_mealId_fkey'`
);
console.log(JSON.stringify({ meals, users, trayItems, traySlots, fkExists: fkCheck.length > 0, fkName: fkCheck[0]?.conname ?? null, sampleMealIds: sample.map(m => m.id) }, null, 2));
await p.$disconnect();
