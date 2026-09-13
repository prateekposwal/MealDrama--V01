import { PrismaClient } from '@prisma/client';
import { CURATED_DISHES, DISH_LIBRARY } from './catalog';

const prisma = new PrismaClient();



const TEST_USERS = [
  { id: 'test-user-001', name: 'Ravi Kumar', phone: '+919876543210', region: 'north', dietType: 'veg' },
  { id: 'test-user-002', name: 'Priya Sharma', phone: '+919876543211', region: 'south', dietType: 'non-veg' },
];

async function upsertMealsBulk(rows: Array<{ id: string; name: string; icon: string; category: string; type: string; region: string; tags: string[] }>) {
  // BULK upsert (ON CONFLICT DO UPDATE = identical to prisma.upsert semantics;
  // the same table FKs/constraints apply — nothing weakened). Sequential
  // Prisma upserts over a Neon free tier take minutes; this is a handful of
  // parameterized jsonb round trips. No string interpolation of values.
  const CHUNK = 300;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Meal" ("id","name","icon","category","type","region","tags")
       SELECT "id","name","icon","category","type","region","tags"
       FROM json_to_recordset($1::json) AS x("id" text,"name" text,"icon" text,"category" text,"type" text,"region" text,"tags" text[])
       ON CONFLICT ("id") DO UPDATE SET
         "name" = EXCLUDED."name", "icon" = EXCLUDED."icon", "category" = EXCLUDED."category",
         "type" = EXCLUDED."type", "region" = EXCLUDED."region", "tags" = EXCLUDED."tags"`,
      JSON.stringify(rows.slice(i, i + CHUNK)),
    );
  }
}

async function upsertVariantsBulk(rows: Array<{ id: string; mealId: string; name: string; cookingStyle: string | null; baseStyle: string | null; addOn: string | null; accompaniments: string[]; mealContext: string | null; regionOverride: string | null }>) {
  const CHUNK = 300;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "MealVariant" ("id","mealId","name","cookingStyle","baseStyle","addOn","accompaniments","mealContext","regionOverride")
       SELECT "id","mealId","name","cookingStyle","baseStyle","addOn","accompaniments","mealContext","regionOverride"
       FROM json_to_recordset($1::json) AS x("id" text,"mealId" text,"name" text,"cookingStyle" text,"baseStyle" text,"addOn" text,"accompaniments" text[],"mealContext" text,"regionOverride" text)
       ON CONFLICT ("id") DO UPDATE SET
         "mealId" = EXCLUDED."mealId", "name" = EXCLUDED."name", "cookingStyle" = EXCLUDED."cookingStyle",
         "baseStyle" = EXCLUDED."baseStyle", "addOn" = EXCLUDED."addOn", "accompaniments" = EXCLUDED."accompaniments",
         "mealContext" = EXCLUDED."mealContext", "regionOverride" = EXCLUDED."regionOverride"`,
      JSON.stringify(rows.slice(i, i + CHUNK)),
    );
  }
}

async function seedMeals() {
  console.log('\n Seeding meals catalog (curated core, bulk)...');
  const mealRows: Array<{ id: string; name: string; icon: string; category: string; type: string; region: string; tags: string[] }> = [];
  const variantRows: Array<{ id: string; mealId: string; name: string; cookingStyle: string | null; baseStyle: string | null; addOn: string | null; accompaniments: string[]; mealContext: string | null; regionOverride: string | null }> = [];
  let ingredientCount = 0;

  const ingredientMap = new Map<string, { name: string; category: string; defaultUnit: string; aliases: string[] }>();

  for (const dish of CURATED_DISHES) {
    mealRows.push({
      id: dish.id,
      name: dish.name,
      icon: dish.icon,
      category: dish.category[0] ?? 'lunch',
      type: dish.type,
      region: dish.region,
      tags: dish.tags,
    });

    for (const variant of dish.variants) {
      variantRows.push({
        id: variant.id,
        mealId: dish.id,
        name: variant.name,
        cookingStyle: variant.cookingStyle || null,
        baseStyle: variant.baseStyle || null,
        addOn: variant.addOn || null,
        accompaniments: variant.accompaniments || [],
        mealContext: variant.mealContext || null,
        regionOverride: variant.regionOverride || null,
      });

      if (variant.accompaniments && variant.accompaniments.length > 0) {
        for (const acc of variant.accompaniments) {
          const accId = acc.toLowerCase().replace(/\s+/g, '-');
          if (!ingredientMap.has(acc)) {
            ingredientMap.set(acc, { name: acc, category: 'pantry', defaultUnit: 'unit', aliases: [] });
          }
          ingredientCount++;
        }
      }
    }
  }

  await upsertMealsBulk(mealRows);
  await upsertVariantsBulk(variantRows);

  // Ingredient links stay sequential (in practice zero rows — the curated
  // catalog sets `accompaniments` on no dish; kept for compatibility).
  for (const dish of CURATED_DISHES) {
    for (const variant of dish.variants) {
      if (variant.accompaniments && variant.accompaniments.length > 0) {
        for (const acc of variant.accompaniments) {
          const accId = acc.toLowerCase().replace(/\s+/g, '-');
          await prisma.mealIngredient.upsert({
            where: { mealId_ingredientId: { mealId: dish.id, ingredientId: accId } },
            update: { qtyPerServing: 1, unit: 'unit' },
            create: { mealId: dish.id, ingredientId: accId, qtyPerServing: 1, unit: 'unit' },
          });
        }
      }
    }
  }

  for (const [, data] of ingredientMap) {
    const id = data.name.toLowerCase().replace(/\s+/g, '-');
    await prisma.ingredient.upsert({
      where: { id },
      update: { name: data.name, category: data.category, defaultUnit: data.defaultUnit, aliases: data.aliases },
      create: { id, name: data.name, category: data.category, defaultUnit: data.defaultUnit, aliases: data.aliases },
    });
  }

  console.log(`   ${mealRows.length} curated meals, ${variantRows.length} variants, ${ingredientCount} ingredient links`);
  return { dishCount: mealRows.length, variantCount: variantRows.length, ingredientCount };
}

async function seedLibraryMeals() {
  // Converge the `Meal` table onto the CLIENT's live catalog: every id the
  // app can post as TrayItem.mealId must exist as a Meal row, or the writer
  // dies on TrayItem_mealId_fkey (the first-load tray seed posts DISH_LIBRARY
  // ids; the old seed covered only 67 curated rows, so a "fully seeded" dev
  // DB still 500'd on any library pick outside that subset).
  console.log('\n Seeding full DISH_LIBRARY catalog (client-canonical, bulk)...');

  const mealRows: Array<{ id: string; name: string; icon: string; category: string; type: string; region: string; tags: string[] }> = [];
  const variantRows: Array<{ id: string; mealId: string; name: string; cookingStyle: string | null; baseStyle: string | null; addOn: string | null; accompaniments: string[]; mealContext: string | null; regionOverride: string | null }> = [];

  for (const dish of DISH_LIBRARY) {
    const d = dish as any;
    mealRows.push({
      id: d.id,
      name: d.name ?? d.id,
      icon: d.icon ?? '🍽️',
      category: Array.isArray(d.category) ? (d.category[0] ?? 'lunch') : (d.category ?? 'lunch'),
      type: d.type ?? 'veg',
      region: d.region ?? 'north',
      tags: Array.isArray(d.tags) ? d.tags : [],
    });
    for (const v of d.variants ?? []) {
      if (!v?.id) continue;
      variantRows.push({
        id: v.id,
        mealId: d.id,
        name: v.name ?? d.name ?? d.id,
        cookingStyle: v.cookingStyle ?? null,
        baseStyle: v.baseStyle ?? null,
        addOn: v.addOn ?? null,
        accompaniments: Array.isArray(v.accompaniments) ? v.accompaniments : [],
        mealContext: v.mealContext ?? null,
        regionOverride: v.regionOverride ?? null,
      });
    }
  }

  await upsertMealsBulk(mealRows);
  await upsertVariantsBulk(variantRows);

  console.log(`   ${mealRows.length} library meals, ${variantRows.length} variants (client-canonical catalog)`);
  return { libraryMeals: mealRows.length, libraryVariants: variantRows.length };
}

async function seedTestUsers() {
  console.log('\n Seeding test users...');
  for (const user of TEST_USERS) {
    // IDEMPOTENT against a phone-taken DB: the upsert keys on `id`, but a
    // dev DB that already has the TEST_USERS phone on a DIFFERENT row would
    // make the create branch hit the unique(phone) constraint (P2002).
    // Adopt the existing phone row (update in place) so re-running the seed
    // on a dirty DB converges instead of crashing — FK rules untouched.
    const existing = await prisma.user.findUnique({ where: { phone: user.phone } });
    const targetId = existing?.id ?? user.id;
    await prisma.user.upsert({
      where: { id: targetId },
      update: { name: user.name, phone: user.phone },
      create: { id: targetId, name: user.name, phone: user.phone },
    });
    await prisma.userProfile.upsert({
      where: { userId: targetId },
      update: { region: user.region, dietType: user.dietType },
      create: { userId: targetId, region: user.region, dietType: user.dietType },
    });
  }
  console.log(`   ${TEST_USERS.length} test users (phone-adopted)`);
}

async function main() {
  const mode = process.argv[2];

  if (mode === '--reset') {
    console.log(' Resetting database...');
    await prisma.mealIngredient.deleteMany();
    await prisma.mealVariant.deleteMany();
    await prisma.meal.deleteMany();
    await prisma.ingredient.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.userPlan.deleteMany();
    await prisma.completedSlot.deleteMany();
    console.log('   All tables cleared.');
  }

  console.log('\n MealDrama Database Seed');
  console.log('==========================');

  const { dishCount, variantCount, ingredientCount } = await seedMeals();
  const { libraryMeals, libraryVariants } = await seedLibraryMeals();
  await seedTestUsers();

  console.log('\n Seed complete!');
  console.log(`   ${dishCount} curated + ${libraryMeals} library meals, ${variantCount} curated + ${libraryVariants} library variants, ${ingredientCount} ingredient links`);
  console.log('\nTo reset and reseed: npm run seed -- --reset');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
