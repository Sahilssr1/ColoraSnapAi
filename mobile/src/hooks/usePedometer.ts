import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import { apiClient } from '../api/client';
import {
  isNativeStepTrackerAvailable,
  ensureTrackingPermissions,
  startNativeTracking,
  getNativeSteps,
} from '../native/stepTracker';

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
  const [nativeTodaySteps, setNativeTodaySteps] = useState<number>(0);

  const initialStepsRef = useRef<number>(initialSteps);
  useEffect(() => {
    initialStepsRef.current = initialSteps;
    setPastStepCount((prev) => Math.max(prev, initialSteps));
    lastSyncCountRef.current = Math.max(lastSyncCountRef.current, initialSteps);
  }, [initialSteps]);

  const lastSyncCountRef = useRef<number>(initialSteps);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<Pedometer.Subscription | null>(null);

  // Sync to PostgreSQL DB (Debounced)
  const syncStepsToBackend = useCallback(async (steps: number) => {
    if (steps < lastSyncCountRef.current) return;
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
    }, 2500);
  }, [syncStepsToBackend]);

  // Read native step tracker from Android SharedPreferences
  const pollNativeSteps = useCallback(async () => {
    if (!isNativeStepTrackerAvailable) return;
    try {
      const status = await getNativeSteps();
      if (status && typeof status.todaySteps === 'number') {
        setIsSensorTracking(true);
        setNativeTodaySteps((prev) => Math.max(prev, status.todaySteps));

        const todayStr = new Date().toISOString().split('T')[0];
        AsyncStorage.setItem(STORAGE_KEY_STEPS, String(status.todaySteps)).catch(() => {});
        AsyncStorage.setItem(STORAGE_KEY_DATE, todayStr).catch(() => {});

        const total = Math.max(status.todaySteps, initialStepsRef.current);
        if (total > lastSyncCountRef.current && total - lastSyncCountRef.current >= 3) {
          scheduleDbSync(total);
        }
      }
    } catch (err) {
      console.log('Error reading native steps:', err);
    }
  }, [scheduleDbSync]);

  // 1. Restore cached steps on instant cold-start (zero delay)
  useEffect(() => {
    const restoreCache = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const savedDate = await AsyncStorage.getItem(STORAGE_KEY_DATE);
        if (savedDate === todayStr) {
          const savedSteps = await AsyncStorage.getItem(STORAGE_KEY_STEPS);
          if (savedSteps) {
            const parsed = parseInt(savedSteps, 10);
            if (!isNaN(parsed) && parsed > 0) {
              setNativeTodaySteps((prev) => Math.max(prev, parsed));
            }
          }
        }
      } catch {}
    };
    restoreCache();
  }, []);

  // 2. Poll native steps immediately and continuously every 1.5s
  useEffect(() => {
    if (!isNativeStepTrackerAvailable) return;

    // Immediate read on mount
    pollNativeSteps();

    // Polling interval
    const interval = setInterval(pollNativeSteps, 1500);

    // Ensure permissions and launch background service
    ensureTrackingPermissions()
      .then((granted) => {
        if (granted) {
          startNativeTracking().catch(() => {});
        }
      })
      .catch(() => {});

    return () => clearInterval(interval);
  }, [pollNativeSteps]);

  // 3. Load saved historical days
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
        console.error('Failed to load step history:', e);
      }
    };
    loadHistory();
  }, []);

  // 4. Fetch OS Hardware Steps for Today (iOS HealthKit fallback)
  const fetchTodayStepsFromOS = useCallback(async () => {
    try {
      const { status } = await Pedometer.requestPermissionsAsync();
      if (status !== 'granted') {
        setIsPedometerAvailable(false);
        return;
      }

      const available = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(available);

      if (available) {
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        try {
          const result = await Pedometer.getStepCountAsync(start, end);
          if (result && result.steps !== undefined) {
            setPastStepCount((prev) => Math.max(prev, result.steps, initialStepsRef.current));
            if (result.steps - lastSyncCountRef.current >= 3) {
              scheduleDbSync(result.steps);
            }
          }
        } catch {
          // Expected on Android (getStepCountAsync is iOS-only)
        }
      }
    } catch {
      setIsPedometerAvailable(false);
    }
  }, [scheduleDbSync]);

  // 5. Handle Foreground / Background Lifecycle (poll native immediately on app open)
  useEffect(() => {
    pollNativeSteps();
    fetchTodayStepsFromOS();

    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        pollNativeSteps();
        fetchTodayStepsFromOS();
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, [pollNativeSteps, fetchTodayStepsFromOS]);

  // 6. Live step tracking fallback via Expo Pedometer (when native service is unavailable)
  useEffect(() => {
    if (isNativeStepTrackerAvailable) return;
    let sub: Pedometer.Subscription | null = null;

    const startLiveTracking = async () => {
      try {
        if (!isPedometerAvailable) return;
        setIsSensorTracking(true);
        sub = Pedometer.watchStepCount((result) => {
          setCurrentStepCount(result.steps);
          const nextTotal = pastStepCount + result.steps;
          if (nextTotal - lastSyncCountRef.current >= 3) {
            scheduleDbSync(nextTotal);
          }
        });
        subscriptionRef.current = sub;
      } catch {
        setIsSensorTracking(false);
      }
    };

    startLiveTracking();

    return () => {
      if (sub) sub.remove();
      subscriptionRef.current = null;
    };
  }, [isPedometerAvailable, pastStepCount, scheduleDbSync]);

  // 7. Toggle Live Walk Simulation
  const toggleWalkSimulation = useCallback(() => {
    if (isWalkingSimulated) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      setIsWalkingSimulated(false);
    } else {
      setIsWalkingSimulated(true);
      simIntervalRef.current = setInterval(() => {
        setCurrentStepCount((prev) => {
          const nextCurrent = prev + 2;
          const nextTotal = pastStepCount + nextCurrent;
          if (nextTotal - lastSyncCountRef.current >= 4) {
            scheduleDbSync(nextTotal);
          }
          return nextCurrent;
        });
      }, 700);
    }
  }, [isWalkingSimulated, pastStepCount, scheduleDbSync]);

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  // 8. Add manual steps & sync to database
  const addSteps = async (count: number) => {
    const nextCount = pastStepCount + currentStepCount + count;
    setPastStepCount(nextCount);
    setCurrentStepCount(0);
    try {
      await syncStepsToBackend(nextCount);
    } catch {}
  };

  // Reconciled Total Steps: Max of Native Service, Past/Current Expo sensor, and Backend DB
  const totalSteps = Math.max(
    nativeTodaySteps,
    pastStepCount + currentStepCount,
    initialSteps
  );

  const burnedCalories = Math.round(totalSteps * 0.04);
  const distanceKm = Number((totalSteps * 0.000762).toFixed(2));

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
