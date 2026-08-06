export type GoalType = 'LOSE_WEIGHT' | 'MAINTAIN' | 'GAIN_WEIGHT';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
export type FoodSource = 'AI_SCAN' | 'BARCODE' | 'USDA' | 'OPEN_FOOD_FACTS' | 'MANUAL';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  height?: number | null;
  weight?: number | null;
  age?: number | null;
  gender: Gender;
  goal: GoalType;
  activityLevel: ActivityLevel;
  bmr?: number;
  bmi?: number;
  bmiCategory?: string;
  tdee?: number;
  goals?: UserGoals | null;
}

export interface UserGoals {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetWater: number;
  targetFiber?: number;
  targetSodium?: number;
  targetSugar?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  image?: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol?: number;
  potassium?: number;
  vitaminA?: number;
  vitaminB?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  calcium?: number;
  iron?: number;
  magnesium?: number;
  zinc?: number;
  copper?: number;
  phosphorus?: number;
  omega3?: number;
  omega6?: number;
  waterContent?: number;
  glycemicLoad?: number;
  confidenceScore?: number;
  healthRating?: string;
  dietaryTags?: string[];
  source?: FoodSource;
}

export interface MealLogItem {
  id: string;
  userId: string;
  foodId: string;
  mealType: MealType;
  quantity: number;
  servingSize: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  date: string;
  food: FoodItem;
}

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

export interface DashboardData {
  date: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  goals: UserGoals;
  summary: {
    caloriesConsumed: number;
    caloriesRemaining: number;
    proteinConsumed: number;
    carbsConsumed: number;
    fatConsumed: number;
    fiberConsumed: number;
    sugarConsumed: number;
    sodiumConsumed: number;
    waterConsumed: number;
    waterRemaining: number;
    caloriePercentage: number;
    proteinPercentage: number;
    carbsPercentage: number;
    fatPercentage: number;
    waterPercentage: number;
  };
  bodyMetrics: {
    weight: number;
    height: number;
    bmr: number;
    bmi: number;
    bmiCategory: string;
  };
  sleep?: {
    hours: number;
    deepHours?: number;
    score: number | null;
    status: string;
    loggedAt?: string;
  };
  steps?: {
    count: number;
    burnedCalories?: number;
  };
  mealSections: Record<
    MealType,
    {
      items: MealLogItem[];
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }
  >;
  aiAnalysis: {
    overallScore: number;
    summary: string;
    alerts: NutritionAlert[];
    suggestedFoodSwaps: Array<{
      originalFood: string;
      healthierAlternative: string;
      benefit: string;
    }>;
    micronutrientBalance: Record<
      string,
      { current: number; rda: number; unit: string; percentage: number; status: string }
    >;
  };
}

export interface StepHistoryItem {
  date: string;
  day: string;
  steps: number;
  burnedCalories: number;
  goal: number;
  completed?: boolean;
}

export interface StepHistoryResponse {
  days: number;
  avgSteps: number;
  totalSteps: number;
  stepHistory: StepHistoryItem[];
}

export interface TrendsData {
  period: 'day' | 'week' | 'month' | '6month' | 'year' | string;
  days: number;
  targetCalories: number;
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    steps?: number;
  };
  dailyTrends: Array<{
    date: string;
    day?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  stepHistory?: StepHistoryItem[];
  sleepHistory?: Array<{
    date: string;
    day: string;
    hours: number;
    score: number;
    status: string;
  }>;
  weightHistory: Array<{
    date: string;
    weight: number;
  }>;
}
