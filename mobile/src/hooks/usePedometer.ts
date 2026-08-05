import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const lastStepTimeRef = useRef<number>(0);
  const lastSyncCountRef = useRef<number>(initialSteps);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Load saved steps from storage on mount
  useEffect(() => {
    const loadSavedSteps = async () => {
      try {
        const todayDateStr = new Date().toDateString();
        const savedDate = await AsyncStorage.getItem(STORAGE_KEY_DATE);

        if (savedDate === todayDateStr) {
          const savedSteps = await AsyncStorage.getItem(STORAGE_KEY_STEPS);
          if (savedSteps !== null) {
            const parsed = parseInt(savedSteps, 10);
            const base = Math.max(parsed, initialSteps);
            setPastStepCount(base);
            lastSyncCountRef.current = base;
          } else {
            setPastStepCount(initialSteps);
          }
        } else {
          // New day reset
          await AsyncStorage.setItem(STORAGE_KEY_DATE, todayDateStr);
          await AsyncStorage.setItem(STORAGE_KEY_STEPS, `${initialSteps}`);
          setPastStepCount(initialSteps);
          lastSyncCountRef.current = initialSteps;
        }

        // Load step history
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
      } catch {
        setPastStepCount(initialSteps);
      }
    };

    loadSavedSteps();
  }, [initialSteps]);

  // Initialize hardware accelerometer / motion tracking
  useEffect(() => {
    let subscription: any = null;
    let isSubscribed = true;

    const startHardwareTracking = async () => {
      try {
        let ExpoSensors: any = null;
        try {
          ExpoSensors = require('expo-sensors');
        } catch {
          ExpoSensors = null;
        }

        if (ExpoSensors && ExpoSensors.Accelerometer && typeof ExpoSensors.Accelerometer.isAvailableAsync === 'function') {
          const available = await ExpoSensors.Accelerometer.isAvailableAsync().catch(() => false);
          if (available && isSubscribed) {
            ExpoSensors.Accelerometer.setUpdateInterval(100);
            setIsSensorTracking(true);
            setIsPedometerAvailable(true);

            subscription = ExpoSensors.Accelerometer.addListener((data: { x: number; y: number; z: number }) => {
              if (!isSubscribed) return;

              const magnitude = Math.sqrt((data?.x || 0) ** 2 + (data?.y || 0) ** 2 + (data?.z || 0) ** 2);
              const now = Date.now();

              if (magnitude > 1.22 && now - lastStepTimeRef.current > 280) {
                lastStepTimeRef.current = now;
                setCurrentStepCount((prev) => {
                  const nextCurrent = prev + 1;
                  const nextTotal = pastStepCount + nextCurrent;

                  AsyncStorage.setItem(STORAGE_KEY_STEPS, `${nextTotal}`).catch(() => {});

                  if (nextTotal - lastSyncCountRef.current >= 5) {
                    scheduleDbSync(nextTotal);
                  }

                  return nextCurrent;
                });
              }
            });
          } else {
            setIsSensorTracking(false);
            setIsPedometerAvailable(false);
          }
        } else {
          setIsSensorTracking(false);
          setIsPedometerAvailable(false);
        }
      } catch {
        setIsSensorTracking(false);
        setIsPedometerAvailable(false);
      }
    };

    startHardwareTracking().catch(() => {});

    return () => {
      isSubscribed = false;
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [pastStepCount, scheduleDbSync]);

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

          AsyncStorage.setItem(STORAGE_KEY_STEPS, `${nextTotal}`).catch(() => {});

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
    const nextCount = pastStepCount + count;
    setPastStepCount(nextCount);
    try {
      const todayDateStr = new Date().toDateString();
      await AsyncStorage.setItem(STORAGE_KEY_DATE, todayDateStr);
      await AsyncStorage.setItem(STORAGE_KEY_STEPS, `${nextCount}`);
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
