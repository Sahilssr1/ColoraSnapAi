import axios from 'axios';
import { env } from '../config/env.js';
import { foodRepository } from '../repositories/food.repository.js';
import { redisCache } from '../config/redis.js';
import { Food, FoodSource, Prisma } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../config/logger.js';

export class FoodService {
  async searchFoods(query: string, limit = 20): Promise<Food[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    // 1. Search local PostgreSQL database
    let results = await foodRepository.search(cleanQuery, limit);

    // 2. If fewer than 3 results found, query USDA FoodData Central API
    if (results.length < 3 && env.USDA_API_KEY) {
      try {
        const usdaFoods = await this.searchUsdaApi(cleanQuery, limit - results.length);
        for (const uf of usdaFoods) {
          try {
            const saved = await foodRepository.create(uf);
            results.push(saved);
          } catch {
            // Ignore unique constraint errors
          }
        }
      } catch (err) {
        logger.warn('USDA Search API request failed:', err);
      }
    }

    return results;
  }

  async getFoodById(id: string): Promise<Food> {
    const food = await foodRepository.findById(id);
    if (!food) {
      throw new AppError('Food item not found', 404);
    }
    return food;
  }

  async createCustomFood(data: Prisma.FoodCreateInput): Promise<Food> {
    return foodRepository.create({
      ...data,
      source: FoodSource.MANUAL,
    });
  }

  async getUserFavorites(userId: string): Promise<Food[]> {
    return foodRepository.getUserFavorites(userId);
  }

  async toggleFavorite(userId: string, foodId: string): Promise<{ isFavorite: boolean }> {
    const isFav = await foodRepository.isFavorite(userId, foodId);
    if (isFav) {
      await foodRepository.removeFavorite(userId, foodId);
      return { isFavorite: false };
    } else {
      await foodRepository.addFavorite(userId, foodId);
      return { isFavorite: true };
    }
  }

  private async searchUsdaApi(query: string, limit = 5): Promise<Prisma.FoodCreateInput[]> {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${env.USDA_API_KEY}&query=${encodeURIComponent(
      query
    )}&pageSize=${limit}`;

    const response = await axios.get(url, { timeout: 5000 });
    const foods = response.data?.foods || [];

    return foods.map((f: any) => {
      const nutrients = f.foodNutrients || [];
      const getVal = (names: string[]): number => {
        const found = nutrients.find((n: any) =>
          names.some((name) => n.nutrientName?.toLowerCase().includes(name.toLowerCase()))
        );
        return found ? Number(found.value) : 0;
      };

      return {
        name: f.description || 'USDA Food',
        brand: f.brandOwner || f.brandName || 'USDA National Database',
        servingSize: f.servingSize || 100,
        servingUnit: f.servingSizeUnit || 'g',
        calories: getVal(['Energy']),
        protein: getVal(['Protein']),
        carbs: getVal(['Carbohydrate, by difference']),
        fat: getVal(['Total lipid (fat)']),
        fiber: getVal(['Fiber, total dietary']),
        sugar: getVal(['Total Sugars', 'Sugars, total']),
        sodium: getVal(['Sodium, Na']),
        cholesterol: getVal(['Cholesterol']),
        potassium: getVal(['Potassium, K']),
        calcium: getVal(['Calcium, Ca']),
        iron: getVal(['Iron, Fe']),
        vitaminA: getVal(['Vitamin A, RAE']),
        vitaminC: getVal(['Vitamin C']),
        vitaminD: getVal(['Vitamin D']),
        source: FoodSource.USDA,
        confidenceScore: 0.95,
      };
    });
  }
}

export const foodService = new FoodService();
