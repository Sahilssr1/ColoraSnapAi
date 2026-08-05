import { mealRepository } from '../repositories/meal.repository.js';
import { foodRepository } from '../repositories/food.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { MealType } from '@prisma/client';

export interface CreateMealDto {
  userId: string;
  foodId: string;
  mealType: MealType;
  quantity: number; // Multiplier (e.g., 1.5)
  date?: string; // YYYY-MM-DD
}

export class MealService {
  async logMeal(dto: CreateMealDto) {
    const food = await foodRepository.findById(dto.foodId);
    if (!food) {
      throw new AppError('Food item not found', 404);
    }

    const quantity = Math.max(0.1, dto.quantity);
    const date = dto.date ? new Date(dto.date) : new Date();

    const loggedMeal = await mealRepository.create({
      userId: dto.userId,
      foodId: dto.foodId,
      mealType: dto.mealType,
      quantity,
      servingSize: food.servingSize,
      calories: Number((food.calories * quantity).toFixed(1)),
      protein: Number((food.protein * quantity).toFixed(1)),
      carbs: Number((food.carbs * quantity).toFixed(1)),
      fat: Number((food.fat * quantity).toFixed(1)),
      fiber: Number((food.fiber * quantity).toFixed(1)),
      sugar: Number((food.sugar * quantity).toFixed(1)),
      sodium: Number((food.sodium * quantity).toFixed(1)),
      date,
    });

    return loggedMeal;
  }

  async getTodayMeals(userId: string) {
    return mealRepository.findByUserAndDate(userId, new Date());
  }

  async getMealsForDate(userId: string, date: Date) {
    return mealRepository.findByUserAndDate(userId, date);
  }

  async deleteMeal(id: string, userId: string) {
    const success = await mealRepository.delete(id, userId);
    if (!success) {
      throw new AppError('Meal entry not found or unauthorized', 404);
    }
    return { success: true };
  }

  async getRecentFoods(userId: string) {
    return mealRepository.getRecentUniqueFoods(userId, 15);
  }
}

export const mealService = new MealService();
