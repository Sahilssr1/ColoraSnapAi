import { aiAdvisorService } from '../../src/services/aiAdvisor.service';
import { MealType, FoodSource } from '@prisma/client';

describe('AiAdvisorService Unit Tests', () => {
  it('detects protein deficiency when daily intake is low', () => {
    const mockMealLogs: any[] = [
      {
        id: '1',
        userId: 'u1',
        foodId: 'f1',
        mealType: MealType.BREAKFAST,
        quantity: 1,
        servingSize: 100,
        calories: 300,
        protein: 10, // Very low protein
        carbs: 60,
        fat: 5,
        fiber: 2,
        sugar: 10,
        sodium: 200,
        food: {
          servingSize: 100,
          vitaminA: 10,
          vitaminB: 0.1,
          vitaminC: 5,
          vitaminD: 0,
          calcium: 20,
          iron: 0.5,
          magnesium: 15,
          zinc: 0.5,
          potassium: 100,
          source: FoodSource.MANUAL,
        },
      },
    ];

    const mockGoal: any = {
      targetProtein: 150,
      targetSodium: 2300,
      targetSugar: 50,
    };

    const report = aiAdvisorService.analyzeDailyNutrition(mockMealLogs, mockGoal);

    expect(report.overallScore).toBeDefined();
    const proteinAlert = report.alerts.find((a) => a.nutrient === 'Protein');
    expect(proteinAlert).toBeDefined();
    expect(proteinAlert?.type).toBe('DEFICIENCY');
    expect(report.suggestedFoodSwaps.length).toBeGreaterThan(0);
  });

  it('detects excess sodium when exceeding daily threshold', () => {
    const mockMealLogs: any[] = [
      {
        id: '2',
        userId: 'u1',
        foodId: 'f2',
        mealType: MealType.LUNCH,
        quantity: 1,
        servingSize: 200,
        calories: 600,
        protein: 30,
        carbs: 50,
        fat: 20,
        fiber: 5,
        sugar: 10,
        sodium: 3200, // Excessive sodium
        food: {
          servingSize: 200,
          source: FoodSource.MANUAL,
        },
      },
    ];

    const mockGoal: any = {
      targetProtein: 120,
      targetSodium: 2300,
      targetSugar: 50,
    };

    const report = aiAdvisorService.analyzeDailyNutrition(mockMealLogs, mockGoal);

    const sodiumAlert = report.alerts.find((a) => a.nutrient === 'Sodium');
    expect(sodiumAlert).toBeDefined();
    expect(sodiumAlert?.type).toBe('EXCESS');
  });
});
