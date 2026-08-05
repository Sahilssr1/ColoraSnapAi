import { z } from 'zod';

export const logMealSchema = z.object({
  body: z.object({
    foodId: z.string().uuid('Invalid food ID format'),
    mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
    quantity: z.number().positive('Quantity must be greater than 0').default(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  }),
});

export const logWaterSchema = z.object({
  body: z.object({
    amount: z.number().min(10, 'Minimum water amount is 10ml').max(5000, 'Maximum amount per entry is 5000ml'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  }),
});

export const logWeightSchema = z.object({
  body: z.object({
    weight: z.number().min(20, 'Weight must be at least 20kg').max(400, 'Weight must be under 400kg'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    notes: z.string().max(200).optional(),
  }),
});

export const barcodeScanSchema = z.object({
  body: z.object({
    barcode: z.string().min(4, 'Barcode must be at least 4 digits'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    avatar: z.string().url().optional(),
    height: z.number().min(50).max(280).optional(),
    weight: z.number().min(20).max(400).optional(),
    age: z.number().int().min(10).max(120).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    goal: z.enum(['LOSE_WEIGHT', 'MAINTAIN', 'GAIN_WEIGHT']).optional(),
    activityLevel: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE', 'EXTRA_ACTIVE']).optional(),
  }),
});

export const updateGoalsSchema = z.object({
  body: z.object({
    targetCalories: z.number().min(800).max(10000).optional(),
    targetProtein: z.number().min(10).max(500).optional(),
    targetCarbs: z.number().min(10).max(1000).optional(),
    targetFat: z.number().min(10).max(500).optional(),
    targetWater: z.number().min(500).max(10000).optional(),
    targetFiber: z.number().min(5).max(100).optional(),
    targetSodium: z.number().min(500).max(6000).optional(),
    targetSugar: z.number().min(0).max(300).optional(),
  }),
});
