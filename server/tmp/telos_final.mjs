import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const slots = await p.traySlot.findMany({ where: { userId: 'telos-fk-verify-001' }, orderBy: { slot: 'asc' }, select: { date: true, slot: true, items: { select: { mealId: true, quantity: true } } } });
console.log(JSON.stringify(slots, null, 1));
await p.$disconnect();
