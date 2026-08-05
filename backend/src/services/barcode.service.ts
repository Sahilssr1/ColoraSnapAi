import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { foodRepository } from '../repositories/food.repository.js';
import { redisCache } from '../config/redis.js';
import { Food, FoodSource } from '@prisma/client';

export interface BarcodeScanResponse {
  found: boolean;
  food?: Food;
  source?: 'LOCAL_DB' | 'OPEN_FOOD_FACTS' | 'USDA';
  suggestPhotoScan?: boolean;
}

export class BarcodeService {
  async lookupBarcode(barcode: string): Promise<BarcodeScanResponse> {
    const cleanBarcode = barcode.trim();
    logger.info(`🔍 Looking up barcode: [${cleanBarcode}]`);

    // 1. Check Redis Cache
    const cacheKey = `barcode:${cleanBarcode}`;
    const cachedFood = await redisCache.get<Food>(cacheKey);
    if (cachedFood) {
      logger.info(`⚡ Cache hit for barcode: ${cleanBarcode}`);
      return { found: true, food: cachedFood, source: 'LOCAL_DB' };
    }

    // 2. Check Local PostgreSQL Database
    const localFood = await foodRepository.findByBarcode(cleanBarcode);
    if (localFood) {
      await redisCache.set(cacheKey, localFood, 86400); // 24hr cache
      return { found: true, food: localFood, source: 'LOCAL_DB' };
    }

    // 3. Query OpenFoodFacts API
    try {
      const offResult = await this.queryOpenFoodFacts(cleanBarcode);
      if (offResult) {
        const savedFood = await foodRepository.upsertByBarcode(cleanBarcode, offResult);
        await redisCache.set(cacheKey, savedFood, 86400);
        return { found: true, food: savedFood, source: 'OPEN_FOOD_FACTS' };
      }
    } catch (err) {
      logger.warn(`OpenFoodFacts query failed for barcode ${cleanBarcode}:`, err);
    }

    // 4. Fallback to USDA FoodData Central API
    try {
      const usdaResult = await this.queryUsdaFoodData(cleanBarcode);
      if (usdaResult) {
        const savedFood = await foodRepository.upsertByBarcode(cleanBarcode, usdaResult);
        await redisCache.set(cacheKey, savedFood, 86400);
        return { found: true, food: savedFood, source: 'USDA' };
      }
    } catch (err) {
      logger.warn(`USDA query failed for barcode ${cleanBarcode}:`, err);
    }

    // 5. Not found in any database -> Prompt user to take photo
    logger.info(`❌ Barcode ${cleanBarcode} not found in any database. Suggesting AI photo scan.`);
    return {
      found: false,
      suggestPhotoScan: true,
    };
  }

  private async queryOpenFoodFacts(barcode: string): Promise<any | null> {
    const url = `${env.OPENFOODFACTS_BASE_URL}/product/${barcode}.json`;
    const response = await axios.get(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'CaloraAI-MobileApp - Version 1.0' },
    });

    if (response.data?.status !== 1 || !response.data?.product) {
      return null;
    }

    const product = response.data.product;
    const nutriments = product.nutriments || {};

    const calories = nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? (nutriments['energy_100g'] ? nutriments['energy_100g'] / 4.184 : 0);
    const protein = nutriments['proteins_100g'] ?? nutriments['proteins'] ?? 0;
    const carbs = nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'] ?? 0;
    const fat = nutriments['fat_100g'] ?? nutriments['fat'] ?? 0;
    const fiber = nutriments['fiber_100g'] ?? nutriments['fiber'] ?? 0;
    const sugar = nutriments['sugars_100g'] ?? nutriments['sugars'] ?? 0;
    const sodium = (nutriments['sodium_100g'] ?? 0) * 1000; // g to mg

    return {
      name: product.product_name || product.generic_name || 'Packaged Food Item',
      brand: product.brands || product.brand_owner || null,
      barcode,
      image: product.image_front_url || product.image_url || null,
      servingSize: product.serving_quantity ? Number(product.serving_quantity) : 100,
      servingUnit: 'g',
      calories: Number(calories.toFixed(1)),
      protein: Number(protein.toFixed(1)),
      carbs: Number(carbs.toFixed(1)),
      fat: Number(fat.toFixed(1)),
      fiber: Number(fiber.toFixed(1)),
      sugar: Number(sugar.toFixed(1)),
      sodium: Number(sodium.toFixed(1)),
      cholesterol: Number(((nutriments['cholesterol_100g'] ?? 0) * 1000).toFixed(1)),
      potassium: Number(((nutriments['potassium_100g'] ?? 0) * 1000).toFixed(1)),
      calcium: Number(((nutriments['calcium_100g'] ?? 0) * 1000).toFixed(1)),
      iron: Number(((nutriments['iron_100g'] ?? 0) * 1000).toFixed(1)),
      vitaminC: Number(((nutriments['vitamin-c_100g'] ?? 0) * 1000).toFixed(1)),
      source: FoodSource.OPEN_FOOD_FACTS,
      confidenceScore: 0.99,
    };
  }

  private async queryUsdaFoodData(barcode: string): Promise<any | null> {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${env.USDA_API_KEY}&query=${barcode}&pageSize=1`;
    const response = await axios.get(url, { timeout: 5000 });

    if (!response.data?.foods || response.data.foods.length === 0) {
      return null;
    }

    const food = response.data.foods[0];
    const nutrients = food.foodNutrients || [];

    const getNutrient = (namePatterns: string[]): number => {
      const match = nutrients.find((n: any) =>
        namePatterns.some((pattern) => n.nutrientName?.toLowerCase().includes(pattern.toLowerCase()))
      );
      return match?.value ?? 0;
    };

    return {
      name: food.description || 'USDA Food Product',
      brand: food.brandOwner || food.brandName || 'USDA Database',
      barcode,
      servingSize: food.servingSize || 100,
      servingUnit: food.servingSizeUnit || 'g',
      calories: getNutrient(['Energy', 'Energy (Atwater General Factors)']),
      protein: getNutrient(['Protein']),
      carbs: getNutrient(['Carbohydrate, by difference']),
      fat: getNutrient(['Total lipid (fat)']),
      fiber: getNutrient(['Fiber, total dietary']),
      sugar: getNutrient(['Sugars, total including NLEA', 'Total Sugars']),
      sodium: getNutrient(['Sodium, Na']),
      cholesterol: getNutrient(['Cholesterol']),
      potassium: getNutrient(['Potassium, K']),
      calcium: getNutrient(['Calcium, Ca']),
      iron: getNutrient(['Iron, Fe']),
      vitaminA: getNutrient(['Vitamin A, RAE']),
      vitaminC: getNutrient(['Vitamin C, total ascorbic acid']),
      vitaminD: getNutrient(['Vitamin D (D2 + D3)']),
      source: FoodSource.USDA,
      confidenceScore: 0.98,
    };
  }
}

export const barcodeService = new BarcodeService();
