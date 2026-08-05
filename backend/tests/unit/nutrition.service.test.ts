import { nutritionService } from '../../src/services/nutrition.service';
import { GoalType, ActivityLevel, Gender } from '@prisma/client';

describe('NutritionService Unit Tests', () => {
  it('calculates BMR correctly using Mifflin-St Jeor equation for male', () => {
    // Male: 10 * 80 + 6.25 * 180 - 5 * 25 + 5 = 800 + 1125 - 125 + 5 = 1805
    const bmr = nutritionService.calculateBmr(80, 180, 25, Gender.MALE);
    expect(bmr).toBe(1805);
  });

  it('calculates BMR correctly for female', () => {
    // Female: 10 * 60 + 6.25 * 165 - 5 * 30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
    const bmr = nutritionService.calculateBmr(60, 165, 30, Gender.FEMALE);
    expect(bmr).toBe(1320);
  });

  it('calculates BMI and category accurately', () => {
    const normal = nutritionService.calculateBmi(70, 175);
    expect(normal.bmi).toBe(22.9);
    expect(normal.category).toBe('Normal weight');

    const overweight = nutritionService.calculateBmi(85, 175);
    expect(overweight.bmi).toBe(27.8);
    expect(overweight.category).toBe('Overweight');
  });

  it('calculates TDEE with activity multiplier', () => {
    const bmr = 1800;
    const tdeeSedentary = nutritionService.calculateTdee(bmr, ActivityLevel.SEDENTARY);
    expect(tdeeSedentary).toBe(Math.round(1800 * 1.2));

    const tdeeActive = nutritionService.calculateTdee(bmr, ActivityLevel.VERY_ACTIVE);
    expect(tdeeActive).toBe(Math.round(1800 * 1.725));
  });

  it('computes deficit macro targets for weight loss', () => {
    const macros = nutritionService.calculateRecommendedMacros({
      weightKg: 75,
      heightCm: 178,
      age: 26,
      gender: Gender.MALE,
      goal: GoalType.LOSE_WEIGHT,
      activityLevel: ActivityLevel.MODERATE,
    });

    expect(macros.targetCalories).toBeGreaterThan(1200);
    expect(macros.targetProtein).toBeGreaterThan(100);
    expect(macros.targetFat).toBeGreaterThan(30);
    expect(macros.targetCarbs).toBeGreaterThan(50);
    expect(macros.targetWater).toBeGreaterThan(2000);
  });

  it('calculates Glycemic Load correctly', () => {
    // GL = (GI * Net Carbs) / 100
    const gl = nutritionService.calculateGlycemicLoad(70, 30);
    expect(gl).toBe(21);
  });
});
