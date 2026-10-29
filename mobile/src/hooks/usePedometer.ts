import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import { apiClient } from '../api/client';

const STORAGE_KEY_STEPS = '@calora_today_steps';
const STORAGE_KEY_DATE = '@calora_steps_date';
const STORAGE_KEY_HISTORY = '@calora_steps_history';

export interface StepRecord {
  date: string;
  steps: number;
  burnedCalories: number;
}

export const usePedometer = (initialSteps: number = 0) => {
  const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean>(true);
  const [isSensorTracking, setIsSensorTracking] = useState<boolean>(false);
  const [isWalkingSimulated, setIsWalkingSimulated] = useState<boolean>(false);
  const [currentStepCount, setCurrentStepCount] = useState<number>(0);
  const [pastStepCount, setPastStepCount] = useState<number>(initialSteps);
  const [dailyHistory, setDailyHistory] = useState<StepRecord[]>([]);

  const lastSyncCountRef = useRef<number>(initialSteps);
  // Keep the latest pastStepCount in a ref so the live subscription does
  // not have to restart (and lose its session count) every time the
  // past total changes — e.g. on a foreground refetch. Previously the
  // watch effect depended on pastStepCount, so a refetch tore the
  // subscription down and the new watch's steps overwrote the old
  // session count, dropping steps on Android.
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<Pedometer.Subscription | null>(null);

  // Sync to PostgreSQL DB (Debounced)
  const syncStepsToBackend = useCallback(async (steps: number) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await apiClient.post('/analytics/steps', {
        steps,
        date: todayStr,
      });
      lastSyncCountRef.current = steps;

      // Update local history cache
      const rawHistory = await AsyncStorage.getItem(STORAGE_KEY_HISTORY);
      const history: Record<string, number> = rawHistory ? JSON.parse(rawHistory) : {};
      history[todayStr] = steps;
      await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {
      // Offline fallback: keep in local storage
    }
  }, []);

  // Debounced auto-sync trigger
  const scheduleDbSync = useCallback((steps: number) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      syncStepsToBackend(steps);
    }, 3000);
  }, [syncStepsToBackend]);

  // Load saved historical days
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const rawHistory = await AsyncStorage.getItem(STORAGE_KEY_HISTORY);
        if (rawHistory) {
          const historyMap: Record<string, number> = JSON.parse(rawHistory);
          const historyList: StepRecord[] = Object.entries(historyMap).map(([date, steps]) => ({
            date,
            steps,
            burnedCalories: Math.round(steps * 0.04),
          }));
          setDailyHistory(historyList);
        }
      } catch (e) {
        console.error("Failed to load step history:", e);
      }
    };
    loadHistory();
  }, []);

  // Fetch OS Hardware Steps for Today
  const fetchTodayStepsFromOS = useCallback(async () => {
    try {
      const { status } = await Pedometer.requestPermissionsAsync();
      if (status !== 'granted') {
        setIsPedometerAvailable(false);
        setIsSensorTracking(false);
        return;
      }

      const available = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(available);

      if (available) {
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0); // Midnight today

        try {
          // This throws an error on Android!
          const result = await Pedometer.getStepCountAsync(start, end);
          if (result && result.steps !== undefined) {
            // Native OS steps are absolute for the day!
            // We override manual steps if OS has higher step count.
            setPastStepCount(prev => Math.max(prev, result.steps, initialSteps));
            
            if (result.steps - lastSyncCountRef.current >= 5) {
              scheduleDbSync(result.steps);
            }
          }
        } catch (innerError) {
          console.log('Historical steps not available (Android expected):', innerError);
          // Do nothing! We want to keep isPedometerAvailable = true so live tracking still works!
        }
      }
    } catch (error) {
      console.log('Error checking OS pedometer availability:', error);
      setIsPedometerAvailable(false);
    }
  }, [initialSteps, scheduleDbSync]);

  // Handle Foreground / Background Lifecycle
  useEffect(() => {
    // 1. Fetch steps immediately on mount
    fetchTodayStepsFromOS();

    // 2. Fetch steps every time the app comes back to the foreground
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        fetchTodayStepsFromOS();
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, [fetchTodayStepsFromOS]);

  const pastStepCountRef = useRef<number>(initialSteps);
  useEffect(() => {
    pastStepCountRef.current = pastStepCount;
  }, [pastStepCount]);

  // Live step tracking while app is open. NOTE: this is foreground-only
  // by Expo's design — Pedometer updates are not delivered while the app
  // is in the background, and getStepCountAsync (the iOS catch-up path
  // above) is not supported on Android.
  useEffect(() => {
    const startLiveTracking = async () => {
      try {
        if (!isPedometerAvailable) return;

        setIsSensorTracking(true);
        subscriptionRef.current = Pedometer.watchStepCount(result => {
          setCurrentStepCount(result.steps);

          const nextTotal = pastStepCountRef.current + result.steps;
          if (nextTotal - lastSyncCountRef.current >= 5) {
             scheduleDbSync(nextTotal);
          }
        });
      } catch (e) {
        setIsSensorTracking(false);
      }
    };

    startLiveTracking();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isPedometerAvailable, scheduleDbSync]);

  // Toggle Live Walk Simulation (for testing walking live on simulator/desk)
  const toggleWalkSimulation = useCallback(() => {
    if (isWalkingSimulated) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      setIsWalkingSimulated(false);
    } else {
      setIsWalkingSimulated(true);
      simIntervalRef.current = setInterval(() => {
        setCurrentStepCount((prev) => {
          const nextCurrent = prev + 2; // +2 steps per stride
          const nextTotal = pastStepCount + nextCurrent;

          if (nextTotal - lastSyncCountRef.current >= 6) {
            scheduleDbSync(nextTotal);
          }
          return nextCurrent;
        });
      }, 700); // 700ms normal walking step interval
    }
  }, [isWalkingSimulated, pastStepCount, scheduleDbSync]);

  // Clean up simulation timer
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  // Add manual steps & sync to database
  const addSteps = async (count: number) => {
    const nextCount = pastStepCount + currentStepCount + count;
    setPastStepCount(nextCount);
    setCurrentStepCount(0);
    try {
      await syncStepsToBackend(nextCount);
    } catch {}
  };

  const totalSteps = pastStepCount + currentStepCount;
  const burnedCalories = Math.round(totalSteps * 0.04);
  const distanceKm = Number((totalSteps * 0.000762).toFixed(2)); // Average 0.762m stride length

  return {
    isPedometerAvailable,
    isSensorTracking,
    isWalkingSimulated,
    toggleWalkSimulation,
    currentStepCount,
    pastStepCount,
    totalSteps: totalSteps >= 0 ? totalSteps : 0,
    burnedCalories,
    distanceKm,
    dailyHistory,
    addSteps,
    syncStepsToBackend,
  };
};
