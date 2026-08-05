import { Request, Response, NextFunction } from 'express';
import { mealService } from '../services/meal.service.js';

export class MealController {
  async logMeal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const meal = await mealService.logMeal({
        userId,
        foodId: req.body.foodId,
        mealType: req.body.mealType,
        quantity: req.body.quantity,
        date: req.body.date,
      });

      res.status(201).json({
        success: true,
        message: 'Meal logged successfully',
        data: meal,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTodayMeals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const meals = await mealService.getTodayMeals(userId);
      res.status(200).json({
        success: true,
        count: meals.length,
        data: meals,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMealHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const dateStr = req.query.date as string;
      const date = dateStr ? new Date(dateStr) : new Date();

      const meals = await mealService.getMealsForDate(userId, date);
      res.status(200).json({
        success: true,
        date: date.toISOString().split('T')[0],
        count: meals.length,
        data: meals,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMeal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await mealService.deleteMeal(id, userId);
      res.status(200).json({
        success: true,
        message: 'Meal entry deleted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentFoods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const foods = await mealService.getRecentFoods(userId);
      res.status(200).json({
        success: true,
        data: foods,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const mealController = new MealController();
