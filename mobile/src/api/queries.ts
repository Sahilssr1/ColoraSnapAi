import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { DashboardData, FoodItem, MealLogItem, UserProfile, TrendsData, StepHistoryResponse } from '../types';

export const useDashboardQuery = (date?: string) => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', date],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard', {
        params: date ? { date } : undefined,
      });
      return response.data.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useTrendsQuery = (period: 'week' | 'month' = 'week') => {
  return useQuery<TrendsData>({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const response = await apiClient.get('/analytics', {
        params: { period },
      });
      return response.data.data;
    },
  });
};

export const useStepHistoryQuery = (days: number = 7) => {
  return useQuery<StepHistoryResponse>({
    queryKey: ['stepHistory', days],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/steps/history', {
        params: { days },
      });
      return response.data.data;
    },
  });
};

export const useFoodSearchQuery = (searchTerm: string) => {
  return useQuery<FoodItem[]>({
    queryKey: ['foodSearch', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.trim().length === 0) return [];
      const response = await apiClient.get('/foods/search', {
        params: { q: searchTerm, limit: 20 },
      });
      return response.data.data;
    },
    enabled: searchTerm.trim().length > 1,
  });
};

export const useFavoritesQuery = () => {
  return useQuery<FoodItem[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await apiClient.get('/foods/favorites');
      return response.data.data;
    },
  });
};

export const useRecentFoodsQuery = () => {
  return useQuery<FoodItem[]>({
    queryKey: ['recentFoods'],
    queryFn: async () => {
      const response = await apiClient.get('/meal/recent');
      return response.data.data;
    },
  });
};

export const useProfileQuery = () => {
  return useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiClient.get('/user/profile');
      return response.data.data;
    },
  });
};

export const useLogMealMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { foodId: string; mealType: string; quantity: number; date?: string }) => {
      const response = await apiClient.post('/meal', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['recentFoods'] });
    },
  });
};

export const useDeleteMealMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mealId: string) => {
      const response = await apiClient.delete(`/meal/${mealId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useLogWaterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amount: number; date?: string }) => {
      const response = await apiClient.post('/water', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useScanBarcodeMutation = () => {
  return useMutation({
    mutationFn: async (barcode: string) => {
      const response = await apiClient.post('/scan/barcode', { barcode });
      return response.data;
    },
  });
};

export const useScanImageMutation = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiClient.post('/scan/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    },
  });
};

export const useLogSleepMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { hours: number; deepHours?: number; date?: string }) => {
      const response = await apiClient.post('/analytics/sleep', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
    },
  });
};

export const useLogStepsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { steps: number; date?: string }) => {
      const response = await apiClient.post('/analytics/steps', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
    },
  });
};
