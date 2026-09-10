import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Neon free-tier databases cold-start on first connect after idle and can take
 * several seconds. Prisma's initial $connect() in src/index.ts fails with P1001
 * before the warm-up finishes, which made the freshly-launched server die and
 * left the watchdog in a restart loop. This retries $connect() with backoff so
 * the server survives the cold-start window (idempotent — no-op when already
 * connected).
 */
export async function connectWithRetry(maxAttempts = 6): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$connect();
      return;
    } catch (err) {
      if (attempt >= maxAttempts) throw err;
      const delay = Math.min(1000 * 2 ** attempt, 15000);
      console.log(
        `[prisma] database cold-start wait ${attempt}/${maxAttempts} — retrying in ${delay}ms`
      );
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
