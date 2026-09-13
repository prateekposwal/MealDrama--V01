import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
for (let i = 0; i < 3; i++) {
  const t0 = Date.now();
  await p.$queryRaw`SELECT 1`;
  console.log(`probe ${i + 1}: ${Date.now() - t0}ms`);
}
await p.$disconnect();
