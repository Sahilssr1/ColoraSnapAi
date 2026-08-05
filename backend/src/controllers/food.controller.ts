import { Request, Response, NextFunction } from 'express';
import { foodService } from '../services/food.service.js';

export class FoodController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q as string) || '';
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const foods = await foodService.searchFoods(query, limit);
      res.status(200).json({
        success: true,
        count: foods.length,
        data: foods,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const food = await foodService.getFoodById(id);
      res.status(200).json({
        success: true,
        data: food,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const food = await foodService.createCustomFood(req.body);
      res.status(201).json({
        success: true,
        message: 'Food created successfully',
        data: food,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const favorites = await foodService.getUserFavorites(userId);
      res.status(200).json({
        success: true,
        count: favorites.length,
        data: favorites,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { foodId } = req.params;
      const result = await foodService.toggleFavorite(userId, foodId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const foodController = new FoodController();
