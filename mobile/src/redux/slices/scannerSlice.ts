import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RecognizedPlate, FoodItem, MealType } from '../../types';

interface ScannerState {
  currentScan: RecognizedPlate | null;
  selectedFood: FoodItem | null;
  selectedMealType: MealType;
  servingMultiplier: number;
  isScanning: boolean;
}

const initialState: ScannerState = {
  currentScan: null,
  selectedFood: null,
  selectedMealType: 'LUNCH',
  servingMultiplier: 1.0,
  isScanning: false,
};

export const scannerSlice = createSlice({
  name: 'scanner',
  initialState,
  reducers: {
    setCurrentScan: (state, action: PayloadAction<RecognizedPlate | null>) => {
      state.currentScan = action.payload;
      if (action.payload) {
        state.selectedFood = action.payload.primaryFood;
      }
    },
    setSelectedFood: (state, action: PayloadAction<FoodItem | null>) => {
      state.selectedFood = action.payload;
      state.servingMultiplier = 1.0;
    },
    setSelectedMealType: (state, action: PayloadAction<MealType>) => {
      state.selectedMealType = action.payload;
    },
    setServingMultiplier: (state, action: PayloadAction<number>) => {
      state.servingMultiplier = action.payload;
    },
    setIsScanning: (state, action: PayloadAction<boolean>) => {
      state.isScanning = action.payload;
    },
    clearScan: (state) => {
      state.currentScan = null;
      state.selectedFood = null;
      state.servingMultiplier = 1.0;
      state.isScanning = false;
    },
  },
});

export const {
  setCurrentScan,
  setSelectedFood,
  setSelectedMealType,
  setServingMultiplier,
  setIsScanning,
  clearScan,
} = scannerSlice.actions;
export default scannerSlice.reducer;
