import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const meals = await p.meal.findMany({ where: { OR: [{ id: 'idli' }, { id: 'poha-mp' }, { id: 'rajma-chawal' }, { id: 'dal-makhani' }, { id: 'samosa' }, { id: 'paneer-tikka' }, { id: 'dosa' }, { id: 'upma' }, { id: 'alu-paratha' }, { id: 'chole' }] }, select: { id: true, name: true, type: true, category: true } });
for (const m of meals) console.log(m.id, '|', m.name, '|', m.type, '|', Array.isArray(m.category) ? m.category.join(',') : m.category);
await p.$disconnect();
