import { FoodItem, MealType, RecognizedPlate } from '../types';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  Camera: { mealType?: MealType };
  Barcode: { mealType?: MealType };
  FoodResult: { scanResult: RecognizedPlate; mealType: MealType };
  FoodDetail: { food: FoodItem; mealType?: MealType };
  Search: { mealType?: MealType };
  AIInsights: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  ScanTab: undefined;
  AnalyticsTab: undefined;
  ProfileTab: undefined;
};
