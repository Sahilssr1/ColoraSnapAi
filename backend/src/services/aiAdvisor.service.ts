import { MealLog, Food, Goal } from '@prisma/client';
import { RDA_MICRONUTRIENTS } from './nutrition.service.js';

export interface NutritionAlert {
  type: 'DEFICIENCY' | 'EXCESS' | 'TARGET_MET' | 'WARNING';
  nutrient: string;
  currentAmount: number;
  targetAmount: number;
  unit: string;
  percentage: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
}

export interface NutritionAnalysisReport {
  overallScore: number; // 0 - 100
  summary: string;
  alerts: NutritionAlert[];
  suggestedFoodSwaps: Array<{
    originalFood: string;
    healthierAlternative: string;
    benefit: string;
  }>;
  micronutrientBalance: Record<
    string,
    { current: number; rda: number; unit: string; percentage: number; status: 'deficient' | 'optimal' | 'excess' }
  >;
}

export class AiAdvisorService {
  analyzeDailyNutrition(
    mealLogs: Array<MealLog & { food: Food }>,
    userGoal?: Goal | null
  ): NutritionAnalysisReport {
    // 1. Accumulate Daily Totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    let totalSodium = 0;

    const microTotals: Record<string, number> = {
      vitaminA: 0,
      vitaminB: 0,
      vitaminC: 0,
      vitaminD: 0,
      vitaminE: 0,
      vitaminK: 0,
      calcium: 0,
      iron: 0,
      magnesium: 0,
      zinc: 0,
      copper: 0,
      phosphorus: 0,
      potassium: 0,
      omega3: 0,
      omega6: 0,
    };

    for (const log of mealLogs) {
      totalCalories += log.calories;
      totalProtein += log.protein;
      totalCarbs += log.carbs;
      totalFat += log.fat;
      totalFiber += log.fiber;
      totalSugar += log.sugar;
      totalSodium += log.sodium;

      const food = log.food;
      const multiplier = log.quantity * (log.servingSize / (food.servingSize || 100));

      microTotals.vitaminA += (food.vitaminA || 0) * multiplier;
      microTotals.vitaminB += (food.vitaminB || 0) * multiplier;
      microTotals.vitaminC += (food.vitaminC || 0) * multiplier;
      microTotals.vitaminD += (food.vitaminD || 0) * multiplier;
      microTotals.vitaminE += (food.vitaminE || 0) * multiplier;
      microTotals.vitaminK += (food.vitaminK || 0) * multiplier;
      microTotals.calcium += (food.calcium || 0) * multiplier;
      microTotals.iron += (food.iron || 0) * multiplier;
      microTotals.magnesium += (food.magnesium || 0) * multiplier;
      microTotals.zinc += (food.zinc || 0) * multiplier;
      microTotals.copper += (food.copper || 0) * multiplier;
      microTotals.phosphorus += (food.phosphorus || 0) * multiplier;
      microTotals.potassium += (food.potassium || 0) * multiplier;
      microTotals.omega3 += (food.omega3 || 0) * multiplier;
      microTotals.omega6 += (food.omega6 || 0) * multiplier;
    }

    const alerts: NutritionAlert[] = [];
    const targetProtein = userGoal?.targetProtein || 140;
    const targetSodium = userGoal?.targetSodium || 2300;
    const targetSugar = userGoal?.targetSugar || 45;

    // 2. Check Protein
    if (totalProtein < targetProtein * 0.75) {
      alerts.push({
        type: 'DEFICIENCY',
        nutrient: 'Protein',
        currentAmount: Number(totalProtein.toFixed(1)),
        targetAmount: targetProtein,
        unit: 'g',
        percentage: Math.round((totalProtein / targetProtein) * 100),
        severity: 'high',
        message: `You are ${(targetProtein - totalProtein).toFixed(0)}g below your daily protein target.`,
        recommendation: 'Add Greek yogurt, chicken breast, eggs, or a clean whey/plant protein shake to your next meal.',
      });
    }

    // 3. Check Sodium Excess
    if (totalSodium > targetSodium) {
      alerts.push({
        type: 'EXCESS',
        nutrient: 'Sodium',
        currentAmount: Number(totalSodium.toFixed(0)),
        targetAmount: targetSodium,
        unit: 'mg',
        percentage: Math.round((totalSodium / targetSodium) * 100),
        severity: totalSodium > targetSodium * 1.3 ? 'high' : 'medium',
        message: `High Sodium intake: ${totalSodium.toFixed(0)}mg (exceeds recommended ${targetSodium}mg limit).`,
        recommendation: 'Drink extra water to flush excess sodium and increase potassium-rich foods (bananas, avocado, spinach).',
      });
    }

    // 4. Check Sugar Excess
    if (totalSugar > targetSugar) {
      alerts.push({
        type: 'EXCESS',
        nutrient: 'Sugar',
        currentAmount: Number(totalSugar.toFixed(1)),
        targetAmount: targetSugar,
        unit: 'g',
        percentage: Math.round((totalSugar / targetSugar) * 100),
        severity: 'medium',
        message: `High Sugar intake today: ${totalSugar.toFixed(1)}g (limit: ${targetSugar}g).`,
        recommendation: 'Swap sugary drinks or desserts for antioxidant-rich whole berries (blueberries, raspberries).',
      });
    }

    // 5. Check Micronutrients against RDAs
    const micronutrientBalance: Record<
      string,
      { current: number; rda: number; unit: string; percentage: number; status: 'deficient' | 'optimal' | 'excess' }
    > = {};

    let totalScorePoints = 100;

    for (const [key, meta] of Object.entries(RDA_MICRONUTRIENTS)) {
      const current = microTotals[key] || 0;
      const pct = Math.round((current / meta.rda) * 100);

      let status: 'deficient' | 'optimal' | 'excess' = 'optimal';
      if (pct < 50) {
        status = 'deficient';
        totalScorePoints -= 3;
      } else if (meta.maxLimit && current > meta.maxLimit) {
        status = 'excess';
        totalScorePoints -= 4;
      }

      micronutrientBalance[key] = {
        current: Number(current.toFixed(1)),
        rda: meta.rda,
        unit: meta.unit,
        percentage: pct,
        status,
      };

      // Add major deficiency alert if critical (e.g. Iron, Vitamin D, Magnesium)
      if (['iron', 'vitaminD', 'magnesium', 'zinc'].includes(key) && pct < 40) {
        alerts.push({
          type: 'DEFICIENCY',
          nutrient: key.charAt(0).toUpperCase() + key.slice(1),
          currentAmount: Number(current.toFixed(1)),
          targetAmount: meta.rda,
          unit: meta.unit,
          percentage: pct,
          severity: 'medium',
          message: `Low ${key} levels (${pct}% of RDA).`,
          recommendation: `Incorporate more ${key === 'iron' ? 'spinach, lentils, and lean red meats' : key === 'vitaminD' ? 'fatty fish (salmon), egg yolks, or safe sunlight' : 'pumpkin seeds, almonds, and dark leafy greens'}.`,
        });
      }
    }

    // 6. Generate Food Swaps
    const suggestedFoodSwaps = [
      {
        originalFood: 'Refined White Rice / Pasta',
        healthierAlternative: 'Quinoa or Riced Cauliflower',
        benefit: 'Provides 3x more fiber and lowers post-meal glycemic spike by 45%.',
      },
      {
        originalFood: 'Commercial Potato Chips',
        healthierAlternative: 'Air-popped Popcorn with Sea Salt or Roasted Edamame',
        benefit: 'Cuts saturated fats by 70% while boosting plant protein and satiety.',
      },
      {
        originalFood: 'Flavored Sugary Yogurt',
        healthierAlternative: '0% Non-Fat Greek Yogurt + Fresh Blueberries',
        benefit: 'Provides 18g bioavailable protein with zero added sugars.',
      },
    ];

    const overallScore = Math.max(20, Math.min(100, totalScorePoints));

    let summary = 'Great nutritional balance today! Your macronutrient distribution is supporting your metabolic goals.';
    if (alerts.length > 2) {
      summary = `You have ${alerts.length} dietary areas to optimize today. Focus on increasing protein and mineral-dense whole foods.`;
    }

    return {
      overallScore,
      summary,
      alerts,
      suggestedFoodSwaps,
      micronutrientBalance,
    };
  }
}

export const aiAdvisorService = new AiAdvisorService();
