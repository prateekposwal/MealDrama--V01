import { DISH_LIBRARY, Dish, GravyType, isDishVegan, validateDishData } from '../constants/dishLibrary';

export interface QAReport {
    totalDishes: number;
    veganCount: number;
    nonVeganCount: number;
    missingGravyType: string[];
    missingRotiOptions: string[];
    missingRiceOptions: string[];
    missingSideOptions: string[];
    missingBeverageOptions: string[];
    missingCalories: string[];
    missingPrepTime: string[];
    duplicateNames: string[];
    southWithoutRoti: number;
    northWithoutRice: number;
    snacksWithVariants: number;
    passed: boolean;
    summary: string;
}

export function runQAValidation(): QAReport {
    const report: QAReport = {
        totalDishes: DISH_LIBRARY.length,
        veganCount: 0,
        nonVeganCount: 0,
        missingGravyType: [],
        missingRotiOptions: [],
        missingRiceOptions: [],
        missingSideOptions: [],
        missingBeverageOptions: [],
        missingCalories: [],
        missingPrepTime: [],
        duplicateNames: [],
        southWithoutRoti: 0,
        northWithoutRice: 0,
        snacksWithVariants: 0,
        passed: true,
        summary: '',
    };

    const nameCounts = new Map<string, number>();

    for (const dish of DISH_LIBRARY) {
        // Vegan detection
        if (isDishVegan(dish)) {
            report.veganCount++;
        } else {
            report.nonVeganCount++;
        }

        // Required fields
        if (!dish.gravyType) report.missingGravyType.push(dish.name);
        if (!dish.rotiOptions || dish.rotiOptions.length === 0) report.missingRotiOptions.push(dish.name);
        if (!dish.riceOptions || dish.riceOptions.length === 0) report.missingRiceOptions.push(dish.name);
        if (!dish.sideOptions || dish.sideOptions.length === 0) report.missingSideOptions.push(dish.name);
        if (!dish.beverageOptions || dish.beverageOptions.length === 0) report.missingBeverageOptions.push(dish.name);
        if (!dish.calories) report.missingCalories.push(dish.name);
        if (!dish.prepTimeMin) report.missingPrepTime.push(dish.name);

        // Duplicate names
        nameCounts.set(dish.name, (nameCounts.get(dish.name) || 0) + 1);

        // Regional sanity checks
        if (dish.region === 'south' && (!dish.rotiOptions || dish.rotiOptions.length === 0)) {
            report.southWithoutRoti++;
        }
        if (dish.region === 'north' && (!dish.riceOptions || dish.riceOptions.length === 0)) {
            report.northWithoutRice++;
        }
        if (dish.category.includes('snacks') && dish.variants.length > 0) {
            report.snacksWithVariants++;
        }
    }

    // Find duplicates
    for (const [name, count] of nameCounts) {
        if (count > 1) report.duplicateNames.push(name);
    }

    report.passed =
        report.missingGravyType.length === 0 &&
        report.duplicateNames.length === 0;

    const errors = [];
    if (report.missingGravyType.length > 0) errors.push(`${report.missingGravyType.length} missing gravyType`);
    if (report.duplicateNames.length > 0) errors.push(`${report.duplicateNames.length} duplicate names`);
    if (report.missingCalories.length > 0) errors.push(`${report.missingCalories.length} missing calories`);
    if (report.missingPrepTime.length > 0) errors.push(`${report.missingPrepTime.length} missing prepTime`);

    report.summary = report.passed
        ? `✅ All ${report.totalDishes} dishes validated. ${report.veganCount} vegan, ${report.nonVeganCount} non-vegan.`
        : `❌ ${errors.join(', ')}. ${report.totalDishes} total dishes.`;

    return report;
}

export function printQAReport(report: QAReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('  MEALDRAMA DATA QA REPORT');
    console.log('='.repeat(60));
    console.log(`  Total dishes: ${report.totalDishes}`);
    console.log(`  Vegan: ${report.veganCount} | Non-vegan: ${report.nonVeganCount}`);
    console.log('-'.repeat(60));

    if (report.missingGravyType.length > 0) {
        console.log(`  ❌ Missing gravyType (${report.missingGravyType.length}):`);
        report.missingGravyType.slice(0, 5).forEach(n => console.log(`     - ${n}`));
    }
    if (report.duplicateNames.length > 0) {
        console.log(`  ❌ Duplicate names (${report.duplicateNames.length}):`);
        report.duplicateNames.slice(0, 5).forEach(n => console.log(`     - ${n}`));
    }

    const warnings = [];
    if (report.missingRotiOptions.length > 0) warnings.push(`${report.missingRotiOptions.length} no roti options`);
    if (report.missingRiceOptions.length > 0) warnings.push(`${report.missingRiceOptions.length} no rice options`);
    if (report.missingSideOptions.length > 0) warnings.push(`${report.missingSideOptions.length} no side options`);
    if (report.missingBeverageOptions.length > 0) warnings.push(`${report.missingBeverageOptions.length} no beverage options`);
    if (report.missingCalories.length > 0) warnings.push(`${report.missingCalories.length} no calories`);
    if (report.missingPrepTime.length > 0) warnings.push(`${report.missingPrepTime.length} no prep time`);

    if (warnings.length > 0) {
        console.log(`  ⚠️  ${warnings.join(', ')}`);
    }

    console.log('-'.repeat(60));
    console.log(`  South dishes without roti: ${report.southWithoutRoti} (expected)`);
    console.log(`  North dishes without rice: ${report.northWithoutRice} (check)`);
    console.log(`  Snacks with variants: ${report.snacksWithVariants}`);
    console.log('='.repeat(60));
    console.log(`  ${report.summary}`);
    console.log('='.repeat(60) + '\n');
}

const report = runQAValidation();
printQAReport(report);
process.exit(report.passed ? 0 : 1);
