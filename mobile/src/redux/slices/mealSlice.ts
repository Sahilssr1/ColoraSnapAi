import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MealLogItem, FoodItem } from '../../types';

interface MealState {
  selectedDate: string; // YYYY-MM-DD
  recentFoods: FoodItem[];
  favoriteFoods: FoodItem[];
  todayMeals: MealLogItem[];
}

const getTodayString = () => new Date().toISOString().split('T')[0];

const initialState: MealState = {
  selectedDate: getTodayString(),
  recentFoods: [],
  favoriteFoods: [],
  todayMeals: [],
};

export const mealSlice = createSlice({
  name: 'meal',
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setRecentFoods: (state, action: PayloadAction<FoodItem[]>) => {
      state.recentFoods = action.payload;
    },
    setFavoriteFoods: (state, action: PayloadAction<FoodItem[]>) => {
      state.favoriteFoods = action.payload;
    },
    setTodayMeals: (state, action: PayloadAction<MealLogItem[]>) => {
      state.todayMeals = action.payload;
    },
    addMealLog: (state, action: PayloadAction<MealLogItem>) => {
      state.todayMeals.push(action.payload);
    },
    removeMealLog: (state, action: PayloadAction<string>) => {
      state.todayMeals = state.todayMeals.filter((m) => m.id !== action.payload);
    },
  },
});

export const {
  setSelectedDate,
  setRecentFoods,
  setFavoriteFoods,
  setTodayMeals,
  addMealLog,
  removeMealLog,
} = mealSlice.actions;
export default mealSlice.reducer;
