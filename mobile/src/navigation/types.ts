import { FoodItem, MealType } from '../types';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  Camera: { mealType?: MealType };
  Barcode: { mealType?: MealType };
  FoodResult: { scanResult: any; mealType: MealType };
  FoodDetail: { food: FoodItem; mealType?: MealType };
  Search: { mealType?: MealType };
  AIInsights: undefined;
  PrivacyPolicy: undefined;
  About: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  ScanTab: undefined;
  AnalyticsTab: undefined;
  ProfileTab: undefined;
};
