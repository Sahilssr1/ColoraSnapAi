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
  // Native foreground-service totals (Android dev build only). While the
  // service is the source of truth, the Expo watch below is not started,
  // so the two can never race and double-count.
  const [nativeTodaySteps, setNativeTodaySteps] = useState<number>(0);
  const [nativeFailed, setNativeFailed] = useState<boolean>(false);
  const nativeFailCountRef = useRef<number>(0);

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
    // Never post a LOWER total than already synced: the backend stores
    // an absolute daily total, so a watch restart / service restart that
    // reports a smaller number used to overwrite a larger real total
    // with a regression. The backend also guards this now, but never
    // sending the regression is the first line of defence.
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
    }, 3000);
  }, [syncStepsToBackend]);

  // The dashboard total arrives AFTER mount (it is a network query), so
  // initialSteps changes from 0 to the real backend total. useState only
  // reads the first value, so without this the hook kept counting from 0
  // all day and its first sync overwrote the backend total with a smaller
  // number. Take the max, never a lower value.
  useEffect(() => {
    setPastStepCount((prev) => Math.max(prev, initialSteps));
    lastSyncCountRef.current = Math.max(lastSyncCountRef.current, initialSteps);
  }, [initialSteps]);

  // Native foreground-service tracking (Android dev build only).
  // Polling, not an event bridge: the service writes totals to
  // SharedPreferences, JS reads them every 2 seconds, and state is only
  // updated when the value actually changed — so polling cannot cause
  // the re-render flicker that per-step setState used to cause in the
  // header. On any repeated failure, fall back to the Expo watch.
  useEffect(() => {
    if (!isNativeStepTrackerAvailable) return;
    let stopped = false;
    let interval: NodeJS.Timeout | null = null;
    const boot = async () => {
      const granted = await ensureTrackingPermissions();
      if (stopped || !granted) return;
      const started = await startNativeTracking();
      if (stopped || !started) return;
      interval = setInterval(async () => {
        const status = await getNativeSteps();
        if (stopped) return;
        if (!status || !status.sensorAvailable) {
          nativeFailCountRef.current += 1;
          if (nativeFailCountRef.current >= 3) setNativeFailed(true);
          return;
        }
        nativeFailCountRef.current = 0;
        setIsSensorTracking(true);
        setNativeTodaySteps((prev) => (prev === status.todaySteps ? prev : status.todaySteps));
        const total = Math.max(status.todaySteps, initialSteps);
        if (total - lastSyncCountRef.current >= 5) {
          scheduleDbSync(total);
        }
      }, 2000);
    };
    boot();
    return () => {
      stopped = true;
      if (interval) clearInterval(interval);
    };
  }, [initialSteps, scheduleDbSync]);

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
  // above) is not supported on Android. On Android dev builds the native
  // foreground service above is the source of truth instead, so the
  // watch is skipped there (starting both would race and double-count);
  // it only starts if the native service has failed.
  useEffect(() => {
    if (isNativeStepTrackerAvailable && !nativeFailed) return;
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
  }, [isPedometerAvailable, nativeFailed, scheduleDbSync]);

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

  // Native reconciliation: the service's today total is steps since its
  // first start today (persisted in SharedPreferences across restarts),
  // while initialSteps is the last backend-synced total. Taking the max
  // avoids double-counting (never add them) and avoids regressing to a
  // smaller number after a service restart. Steps taken before the
  // service ever started today cannot be recovered on Android without
  // Health Connect — that is a platform limit, not a counting bug, and
  // it is the same limit the old foreground-only watch had.
  const totalSteps =
    isNativeStepTrackerAvailable && !nativeFailed
      ? Math.max(nativeTodaySteps, initialSteps)
      : pastStepCount + currentStepCount;
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
