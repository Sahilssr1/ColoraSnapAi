import { mealRepository } from '../repositories/meal.repository.js';
import { waterRepository } from '../repositories/water.repository.js';
import { weightRepository } from '../repositories/weight.repository.js';
import { goalRepository } from '../repositories/goal.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { analyticsRepository } from '../repositories/analytics.repository.js';
import { nutritionService } from './nutrition.service.js';
import { aiAdvisorService } from './aiAdvisor.service.js';
import { MealType } from '@prisma/client';

export class AnalyticsService {
  async getDashboard(userId: string, targetDate: Date = new Date()) {
    const user = await userRepository.findById(userId);
    const goal = (await goalRepository.findByUserId(userId)) || user?.goals;

    const meals = await mealRepository.findByUserAndDate(userId, targetDate);
    const waterLogs = await waterRepository.findByUserAndDate(userId, targetDate);
    const latestWeightLog = await weightRepository.getLatestByUser(userId);
    const dailyAnalytics = await analyticsRepository.getByDate(userId, targetDate);

    const totalWater = waterLogs.reduce((sum, w) => sum + w.amount, 0);

    // Group meals by mealType and compute totals
    let consumedCalories = 0;
    let consumedProtein = 0;
    let consumedCarbs = 0;
    let consumedFat = 0;
    let consumedFiber = 0;
    let consumedSugar = 0;
    let consumedSodium = 0;

    const mealSections: Record<MealType, { items: typeof meals; calories: number; protein: number; carbs: number; fat: number }> = {
      BREAKFAST: { items: [], calories: 0, protein: 0, carbs: 0, fat: 0 },
      LUNCH: { items: [], calories: 0, protein: 0, carbs: 0, fat: 0 },
      DINNER: { items: [], calories: 0, protein: 0, carbs: 0, fat: 0 },
      SNACK: { items: [], calories: 0, protein: 0, carbs: 0, fat: 0 },
    };

    for (const log of meals) {
      consumedCalories += log.calories;
      consumedProtein += log.protein;
      consumedCarbs += log.carbs;
      consumedFat += log.fat;
      consumedFiber += log.fiber;
      consumedSugar += log.sugar;
      consumedSodium += log.sodium;

      const sec = mealSections[log.mealType];
      if (sec) {
        sec.items.push(log);
        sec.calories += log.calories;
        sec.protein += log.protein;
        sec.carbs += log.carbs;
        sec.fat += log.fat;
      }
    }

    const targetCalories = goal?.targetCalories || 2000;
    const targetProtein = goal?.targetProtein || 150;
    const targetCarbs = goal?.targetCarbs || 200;
    const targetFat = goal?.targetFat || 65;
    const targetWater = goal?.targetWater || 2500;

    const caloriesRemaining = Math.max(0, targetCalories - consumedCalories);

    // AI Advisor Analysis for today
    const aiAnalysis = aiAdvisorService.analyzeDailyNutrition(meals, goal);

    // BMR / BMI
    const currentWeight = latestWeightLog?.weight ?? user?.weight ?? 70;
    const currentHeight = user?.height ?? 175;
    const currentAge = user?.age ?? 25;
    const currentGender = user?.gender ?? 'OTHER';

    const bmr = nutritionService.calculateBmr(currentWeight, currentHeight, currentAge, currentGender);
    const bmiData = nutritionService.calculateBmi(currentWeight, currentHeight);

    // Extract saved sleep and steps from dailyAnalytics deficiencyFlags json
    const meta = (dailyAnalytics?.deficiencyFlags as any) || {};
    const sleepData = meta.sleep || {
      hours: 0,
      score: null,
      status: 'No sleep logged yet today',
      deepHours: 0,
    };

    const stepsData = meta.steps || {
      count: 0,
      burnedCalories: dailyAnalytics?.burnedCalories || 0,
    };

    return {
      date: targetDate.toISOString().split('T')[0],
      user: {
        id: user?.id,
        name: user?.name,
        avatar: user?.avatar,
      },
      goals: {
        calories: targetCalories,
        protein: targetProtein,
        carbs: targetCarbs,
        fat: targetFat,
        water: targetWater,
      },
      summary: {
        caloriesConsumed: Number(consumedCalories.toFixed(0)),
        caloriesRemaining: Number(caloriesRemaining.toFixed(0)),
        proteinConsumed: Number(consumedProtein.toFixed(1)),
        carbsConsumed: Number(consumedCarbs.toFixed(1)),
        fatConsumed: Number(consumedFat.toFixed(1)),
        fiberConsumed: Number(consumedFiber.toFixed(1)),
        sugarConsumed: Number(consumedSugar.toFixed(1)),
        sodiumConsumed: Number(consumedSodium.toFixed(0)),
        waterConsumed: totalWater,
        waterRemaining: Math.max(0, targetWater - totalWater),
        caloriePercentage: Math.min(100, Math.round((consumedCalories / targetCalories) * 100)),
        proteinPercentage: Math.min(100, Math.round((consumedProtein / targetProtein) * 100)),
        carbsPercentage: Math.min(100, Math.round((consumedCarbs / targetCarbs) * 100)),
        fatPercentage: Math.min(100, Math.round((consumedFat / targetFat) * 100)),
        waterPercentage: Math.min(100, Math.round((totalWater / targetWater) * 100)),
      },
      bodyMetrics: {
        weight: currentWeight,
        height: currentHeight,
        bmr,
        bmi: bmiData.bmi,
        bmiCategory: bmiData.category,
      },
      sleep: sleepData,
      steps: stepsData,
      mealSections,
      aiAnalysis,
    };
  }

  async logSleep(userId: string, hours: number, deepHours?: number, date: Date = new Date()) {
    const validHours = Math.max(0.5, Math.min(24, hours));
    const calculatedDeep = deepHours || Number((validHours * 0.22).toFixed(1));

    // Calculate Sleep Score
    const durationScore = Math.min(50, (validHours / 8.0) * 50);
    const qualityScore = Math.min(30, (calculatedDeep / 1.6) * 30);
    const consistencyScore = 20;
    const totalScore = Math.min(100, Math.round(durationScore + qualityScore + consistencyScore));

    let status = 'Optimal • Restorative Sleep';
    if (totalScore >= 90) {
      status = 'Very High • Restorative Sleep';
    } else if (totalScore >= 75) {
      status = 'Good • Healthy Sleep Recovery';
    } else if (totalScore >= 60) {
      status = 'Moderate • Mild Sleep Deficit';
    } else {
      status = 'Low • Sleep Deficit Alert';
    }

    const sleepPayload = {
      hours: validHours,
      deepHours: calculatedDeep,
      score: totalScore,
      status,
      loggedAt: new Date().toISOString(),
    };

    const existing = await analyticsRepository.getByDate(userId, date);
    const existingMeta = (existing?.deficiencyFlags as any) || {};

    await analyticsRepository.upsert(userId, date, {
      deficiencyFlags: {
        ...existingMeta,
        sleep: sleepPayload,
      },
    });

    return sleepPayload;
  }

  async logSteps(userId: string, steps: number, date: Date = new Date()) {
    const existing = await analyticsRepository.getByDate(userId, date);
    const existingMeta = (existing?.deficiencyFlags as any) || {};
    const existingCount = existingMeta.steps?.count ?? 0;
    // Daily steps are an absolute total, not an increment. Two clients
    // (or a restarted watch / service) reporting different totals must
    // never move the stored total backwards: a smaller report is stale,
    // not a user un-walking. Previously the smaller value overwrote the
    // larger one, so the Home count visibly jumped down after a restart.
    // API and response shape are unchanged.
    const validSteps = Math.max(0, Math.round(steps), existingCount);
    const burnedCalories = Number((validSteps * 0.04).toFixed(0));

    const stepsPayload = {
      count: validSteps,
      burnedCalories,
      updatedAt: new Date().toISOString(),
    };

    await analyticsRepository.upsert(userId, date, {
      burnedCalories,
      deficiencyFlags: {
        ...existingMeta,
        steps: stepsPayload,
      },
    });

    return stepsPayload;
  }

  async getStepHistory(userId: string, days: number = 7) {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const analyticsHistory = await analyticsRepository.getHistory(userId, startDate, endDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const stepHistory = [];

    const historyMap = new Map<string, { steps: number; burnedCalories: number }>();
    for (const a of analyticsHistory) {
      const key = a.date.toISOString().split('T')[0];
      const meta = (a.deficiencyFlags as any) || {};
      const steps = meta.steps?.count || (a.burnedCalories ? Math.round(a.burnedCalories / 0.04) : 0);
      const burnedCalories = a.burnedCalories || meta.steps?.burnedCalories || Math.round(steps * 0.04);
      historyMap.set(key, { steps, burnedCalories });
    }

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      const record = historyMap.get(dateKey) || { steps: 0, burnedCalories: 0 };

      stepHistory.push({
        date: dateKey,
        day: dayName,
        steps: record.steps,
        burnedCalories: record.burnedCalories,
        goal: 10000,
        completed: record.steps >= 10000,
      });
    }

    const totalSteps = stepHistory.reduce((sum, item) => sum + item.steps, 0);
    const avgSteps = Math.round(totalSteps / days);

    return {
      days,
      avgSteps,
      totalSteps,
      stepHistory,
    };
  }

  async getTrends(userId: string, periodInput: string = 'week') {
    const rawPeriod = (periodInput || 'week').toLowerCase();
    let period: 'day' | 'week' | 'month' | '6month' | 'year' = 'week';
    if (rawPeriod === 'd' || rawPeriod === 'day') period = 'day';
    else if (rawPeriod === 'w' || rawPeriod === 'week') period = 'week';
    else if (rawPeriod === 'm' || rawPeriod === 'month') period = 'month';
    else if (rawPeriod === '6m' || rawPeriod === '6month') period = '6month';
    else if (rawPeriod === 'y' || rawPeriod === 'year') period = 'year';

    const userGoal = await goalRepository.findByUserId(userId);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (period === 'day') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const mealLogs = await mealRepository.findByUserDateRange(userId, todayStart, todayEnd);
      const analyticsHistory = await analyticsRepository.getHistory(userId, todayStart, todayEnd);
      const todayAnalytics = analyticsHistory[0];
      const meta = (todayAnalytics?.deficiencyFlags as any) || {};
      const todaySteps = meta.steps?.count || 0;
      const todayBurned = todayAnalytics?.burnedCalories || meta.steps?.burnedCalories || 0;
      const todaySleep = meta.sleep || { hours: 0, score: 0, status: 'No record' };

      const intervals = [
        { label: '6A', hour: 6 },
        { label: '9A', hour: 9 },
        { label: '12P', hour: 12 },
        { label: '3P', hour: 15 },
        { label: '6P', hour: 18 },
        { label: '9P', hour: 21 },
      ];

      const currentHour = new Date().getHours();
      const activeIntervalCount = Math.max(1, intervals.filter(i => currentHour >= i.hour - 2).length);

      const stepHistory = intervals.map((intv) => {
        const isPastOrNow = currentHour >= intv.hour - 2;
        const portion = isPastOrNow ? Math.round(todaySteps / activeIntervalCount) : 0;
        return {
          date: todayStart.toISOString().split('T')[0],
          day: intv.label,
          steps: portion,
          burnedCalories: Math.round(portion * 0.04),
          goal: 10000,
        };
      });

      const dailyTrends = intervals.map((intv) => {
        let calories = 0, protein = 0, carbs = 0, fat = 0;
        for (const meal of mealLogs) {
          const mealHour = new Date(meal.createdAt || meal.date).getHours();
          if (Math.abs(mealHour - intv.hour) <= 2) {
            calories += meal.calories;
            protein += meal.protein;
            carbs += meal.carbs;
            fat += meal.fat;
          }
        }
        return {
          date: todayStart.toISOString().split('T')[0],
          day: intv.label,
          calories,
          protein,
          carbs,
          fat,
        };
      });

      const totalCalories = mealLogs.reduce((sum, m) => sum + m.calories, 0);
      const totalProtein = mealLogs.reduce((sum, m) => sum + m.protein, 0);
      const totalCarbs = mealLogs.reduce((sum, m) => sum + m.carbs, 0);
      const totalFat = mealLogs.reduce((sum, m) => sum + m.fat, 0);

      return {
        period,
        days: 1,
        targetCalories: userGoal?.targetCalories || 2000,
        averages: {
          calories: totalCalories,
          protein: Number(totalProtein.toFixed(1)),
          carbs: Number(totalCarbs.toFixed(1)),
          fat: Number(totalFat.toFixed(1)),
          steps: todaySteps,
        },
        dailyTrends,
        stepHistory,
        sleepHistory: [
          {
            date: todayStart.toISOString().split('T')[0],
            day: 'Today',
            hours: todaySleep.hours || 0,
            score: todaySleep.score || 0,
            status: todaySleep.status || 'Restorative Sleep',
          }
        ],
        weightHistory: [],
      };
    }

    if (period === '6month' || period === 'year') {
      const monthCount = period === '6month' ? 6 : 12;
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - monthCount + 1, 1, 0, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const mealLogs = await mealRepository.findByUserDateRange(userId, startDate, endDate);
      const weightHistory = await weightRepository.getHistory(userId, monthCount * 30);
      const analyticsHistory = await analyticsRepository.getHistory(userId, startDate, endDate);

      const monthlyData: Array<{
        monthKey: string;
        label: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        steps: number;
        burnedCalories: number;
        sleepHours: number;
        sleepScore: number;
        daysWithLogs: number;
      }> = [];

      for (let i = 0; i < monthCount; i++) {
        const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
        const label = monthNames[m];
        monthlyData.push({
          monthKey,
          label,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          steps: 0,
          burnedCalories: 0,
          sleepHours: 0,
          sleepScore: 0,
          daysWithLogs: 0,
        });
      }

      for (const meal of mealLogs) {
        const key = meal.date.toISOString().slice(0, 7);
        const mEntry = monthlyData.find(m => m.monthKey === key);
        if (mEntry) {
          mEntry.calories += meal.calories;
          mEntry.protein += meal.protein;
          mEntry.carbs += meal.carbs;
          mEntry.fat += meal.fat;
        }
      }

      for (const a of analyticsHistory) {
        const key = a.date.toISOString().slice(0, 7);
        const mEntry = monthlyData.find(m => m.monthKey === key);
        if (mEntry) {
          mEntry.daysWithLogs += 1;
          const meta = (a.deficiencyFlags as any) || {};
          if (meta.steps) {
            mEntry.steps += meta.steps.count || 0;
            mEntry.burnedCalories += a.burnedCalories || meta.steps.burnedCalories || 0;
          }
          if (meta.sleep) {
            mEntry.sleepHours += meta.sleep.hours || 0;
            mEntry.sleepScore += meta.sleep.score || 0;
          }
        }
      }

      const stepHistory = monthlyData.map(m => {
        const divisor = Math.max(1, m.daysWithLogs);
        const avgDailySteps = Math.round(m.steps / divisor);
        return {
          date: m.monthKey,
          day: m.label,
          steps: avgDailySteps > 0 ? avgDailySteps : (m.monthKey === now.toISOString().slice(0, 7) ? m.steps : 0),
          burnedCalories: Math.round(m.burnedCalories / divisor),
          goal: 10000,
        };
      });

      const dailyTrends = monthlyData.map(m => {
        const daysInMonth = 30;
        return {
          date: m.monthKey,
          day: m.label,
          calories: Math.round(m.calories / daysInMonth),
          protein: Number((m.protein / daysInMonth).toFixed(1)),
          carbs: Number((m.carbs / daysInMonth).toFixed(1)),
          fat: Number((m.fat / daysInMonth).toFixed(1)),
        };
      });

      const sleepHistory = monthlyData.map(m => {
        const divisor = Math.max(1, m.daysWithLogs);
        return {
          date: m.monthKey,
          day: m.label,
          hours: Number((m.sleepHours / divisor).toFixed(1)),
          score: Math.round(m.sleepScore / divisor),
          status: 'Monthly Average',
        };
      });

      const avgCalories = dailyTrends.reduce((sum, d) => sum + d.calories, 0) / monthCount;
      const avgProtein = dailyTrends.reduce((sum, d) => sum + d.protein, 0) / monthCount;
      const avgCarbs = dailyTrends.reduce((sum, d) => sum + d.carbs, 0) / monthCount;
      const avgFat = dailyTrends.reduce((sum, d) => sum + d.fat, 0) / monthCount;
      const avgSteps = Math.round(stepHistory.reduce((sum, s) => sum + s.steps, 0) / monthCount);

      return {
        period,
        days: monthCount * 30,
        targetCalories: userGoal?.targetCalories || 2000,
        averages: {
          calories: Number(avgCalories.toFixed(0)),
          protein: Number(avgProtein.toFixed(1)),
          carbs: Number(avgCarbs.toFixed(1)),
          fat: Number(avgFat.toFixed(1)),
          steps: avgSteps,
        },
        dailyTrends,
        stepHistory,
        sleepHistory,
        weightHistory: weightHistory.map((w) => ({
          date: w.date.toISOString().split('T')[0],
          weight: w.weight,
        })),
      };
    }

    // Default: 'week' (7 days) or 'month' (30 days)
    const days = period === 'week' ? 7 : 30;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const mealLogs = await mealRepository.findByUserDateRange(userId, startDate, endDate);
    const weightHistory = await weightRepository.getHistory(userId, days);
    const analyticsHistory = await analyticsRepository.getHistory(userId, startDate, endDate);

    const dayMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number; date: string; day: string }>();
    const stepMap = new Map<string, { steps: number; burnedCalories: number }>();
    const sleepMap = new Map<string, { hours: number; score: number; status: string }>();

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      const dayOfMonth = d.getDate();
      const label = period === 'month' ? String(dayOfMonth) : dayName;
      dayMap.set(key, { date: key, day: label, calories: 0, protein: 0, carbs: 0, fat: 0 });
      stepMap.set(key, { steps: 0, burnedCalories: 0 });
      sleepMap.set(key, { hours: 0, score: 0, status: 'No record' });
    }

    for (const log of mealLogs) {
      const key = log.date.toISOString().split('T')[0];
      const entry = dayMap.get(key);
      if (entry) {
        entry.calories += log.calories;
        entry.protein += log.protein;
        entry.carbs += log.carbs;
        entry.fat += log.fat;
      }
    }

    for (const a of analyticsHistory) {
      const key = a.date.toISOString().split('T')[0];
      const meta = (a.deficiencyFlags as any) || {};
      if (meta.steps) {
        stepMap.set(key, {
          steps: meta.steps.count || 0,
          burnedCalories: a.burnedCalories || meta.steps.burnedCalories || 0,
        });
      }
      if (meta.sleep) {
        sleepMap.set(key, {
          hours: meta.sleep.hours || 0,
          score: meta.sleep.score || 0,
          status: meta.sleep.status || 'Restorative Sleep',
        });
      }
    }

    const dailyTrends = Array.from(dayMap.values());
    const stepHistory = Array.from(stepMap.entries()).map(([date, data]) => {
      const d = new Date(date);
      const dayName = dayNames[d.getDay()];
      const dayOfMonth = d.getDate();
      const label = period === 'month' ? String(dayOfMonth) : dayName;
      return {
        date,
        day: label,
        steps: data.steps,
        burnedCalories: data.burnedCalories,
        goal: 10000,
      };
    });

    const sleepHistory = Array.from(sleepMap.entries()).map(([date, data]) => {
      const d = new Date(date);
      const dayName = dayNames[d.getDay()];
      return {
        date,
        day: dayName,
        hours: data.hours,
        score: data.score,
        status: data.status,
      };
    });

    const avgCalories = dailyTrends.reduce((sum, d) => sum + d.calories, 0) / days;
    const avgProtein = dailyTrends.reduce((sum, d) => sum + d.protein, 0) / days;
    const avgCarbs = dailyTrends.reduce((sum, d) => sum + d.carbs, 0) / days;
    const avgFat = dailyTrends.reduce((sum, d) => sum + d.fat, 0) / days;
    const avgSteps = Math.round(stepHistory.reduce((sum, s) => sum + s.steps, 0) / days);

    return {
      period,
      days,
      targetCalories: userGoal?.targetCalories || 2000,
      averages: {
        calories: Number(avgCalories.toFixed(0)),
        protein: Number(avgProtein.toFixed(1)),
        carbs: Number(avgCarbs.toFixed(1)),
        fat: Number(avgFat.toFixed(1)),
        steps: avgSteps,
      },
      dailyTrends,
      stepHistory,
      sleepHistory,
      weightHistory: weightHistory.map((w) => ({
        date: w.date.toISOString().split('T')[0],
        weight: w.weight,
      })),
    };
  }
}

export const analyticsService = new AnalyticsService();
