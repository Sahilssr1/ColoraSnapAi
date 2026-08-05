import { GoalType, ActivityLevel, Gender } from '@prisma/client';

export interface MacroCalculationInput {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  goal: GoalType;
  activityLevel: ActivityLevel;
}

export interface RecommendedMacros {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetWater: number;
  targetFiber: number;
  targetSodium: number;
  targetSugar: number;
}

// Recommended Daily Allowances (RDAs) based on NIH & WHO guidelines
export const RDA_MICRONUTRIENTS: Record<string, { rda: number; unit: string; maxLimit?: number }> = {
  vitaminA: { rda: 900, unit: 'mcg', maxLimit: 3000 },
  vitaminB: { rda: 2.4, unit: 'mg' },
  vitaminC: { rda: 90, unit: 'mg', maxLimit: 2000 },
  vitaminD: { rda: 20, unit: 'mcg', maxLimit: 100 },
  vitaminE: { rda: 15, unit: 'mg', maxLimit: 1000 },
  vitaminK: { rda: 120, unit: 'mcg' },
  calcium: { rda: 1000, unit: 'mg', maxLimit: 2500 },
  iron: { rda: 18, unit: 'mg', maxLimit: 45 },
  magnesium: { rda: 400, unit: 'mg', maxLimit: 700 },
  zinc: { rda: 11, unit: 'mg', maxLimit: 40 },
  copper: { rda: 0.9, unit: 'mg', maxLimit: 10 },
  phosphorus: { rda: 700, unit: 'mg', maxLimit: 4000 },
  potassium: { rda: 3400, unit: 'mg' },
  sodium: { rda: 2300, unit: 'mg', maxLimit: 2300 },
  omega3: { rda: 1.6, unit: 'g' },
  omega6: { rda: 14, unit: 'g' },
  fiber: { rda: 30, unit: 'g' },
};

export class NutritionService {
  /**
   * Calculate Basal Metabolic Rate (BMR) via Mifflin-St Jeor Equation
   */
  calculateBmr(weightKg: number, heightCm: number, age: number, gender: Gender): number {
    const s = gender === Gender.MALE ? 5 : gender === Gender.FEMALE ? -161 : -78;
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + s);
  }

  /**
   * Calculate Body Mass Index (BMI)
   */
  calculateBmi(weightKg: number, heightCm: number): { bmi: number; category: string } {
    const heightM = heightCm / 100;
    const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

    let category = 'Normal weight';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi >= 25 && bmi < 29.9) category = 'Overweight';
    else if (bmi >= 30) category = 'Obese';

    return { bmi, category };
  }

  /**
   * Calculate Total Daily Energy Expenditure (TDEE)
   */
  calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
    const activityMultipliers: Record<ActivityLevel, number> = {
      [ActivityLevel.SEDENTARY]: 1.2,
      [ActivityLevel.LIGHT]: 1.375,
      [ActivityLevel.MODERATE]: 1.55,
      [ActivityLevel.VERY_ACTIVE]: 1.725,
      [ActivityLevel.EXTRA_ACTIVE]: 1.9,
    };

    const multiplier = activityMultipliers[activityLevel] || 1.55;
    return Math.round(bmr * multiplier);
  }

  /**
   * Computes personalized macro targets according to user goal
   */
  calculateRecommendedMacros(input: MacroCalculationInput): RecommendedMacros {
    const bmr = this.calculateBmr(input.weightKg, input.heightCm, input.age, input.gender);
    const tdee = this.calculateTdee(bmr, input.activityLevel);

    let targetCalories = tdee;
    if (input.goal === GoalType.LOSE_WEIGHT) {
      targetCalories = Math.max(1200, Math.round(tdee - 500)); // 500 kcal deficit
    } else if (input.goal === GoalType.GAIN_WEIGHT) {
      targetCalories = Math.round(tdee + 400); // 400 kcal surplus
    }

    // High protein split for health & satiety: 2.0g per kg of bodyweight
    const targetProtein = Math.round(Math.min(targetCalories * 0.35 / 4, input.weightKg * 2.0));
    // Fat: 25-30% of total calories
    const targetFat = Math.round((targetCalories * 0.25) / 9);
    // Carbs: Remaining calories
    const remainingCalories = targetCalories - targetProtein * 4 - targetFat * 9;
    const targetCarbs = Math.round(Math.max(50, remainingCalories / 4));

    // Water: 35ml per kg of bodyweight + activity buffer
    const targetWater = Math.round(input.weightKg * 35 + (input.activityLevel === ActivityLevel.VERY_ACTIVE ? 1000 : 500));

    return {
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      targetWater,
      targetFiber: 30,
      targetSodium: 2300,
      targetSugar: Math.round((targetCalories * 0.10) / 4), // max 10% from free sugars
    };
  }

  /**
   * Calculates Glycemic Load (GL)
   * GL = (Glycemic Index * Net Carbs) / 100
   */
  calculateGlycemicLoad(glycemicIndex: number, netCarbs: number): number {
    return Number(((glycemicIndex * Math.max(0, netCarbs)) / 100).toFixed(1));
  }
}

export const nutritionService = new NutritionService();
