import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const meals = await p.meal.count();
const check = await p.meal.findMany({
  where: { id: { in: ['poha-mp', 'dal-tadka-central', 'rajma-chawal', 'aloo-paratha'] } },
  select: { id: true, name: true, category: true, type: true },
});
const orphans = await p.trayItem.count({ where: { OR: [{ mealId: { not: null }, meal: { is: null } }, { customDishId: { not: null }, customDish: { is: null } }] } });
console.log(JSON.stringify({ meals, parents: check, orphanTrayItems: orphans }, null, 2));
await p.$disconnect();
