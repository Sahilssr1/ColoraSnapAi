import { prisma } from '../config/prisma.js';
import { DailyAnalytics, Prisma } from '@prisma/client';

export class AnalyticsRepository {
  async getByDate(userId: string, date: Date): Promise<DailyAnalytics | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.dailyAnalytics.findUnique({
      where: {
        userId_date: {
          userId,
          date: startOfDay,
        },
      },
    });
  }

  async getHistory(userId: string, startDate: Date, endDate: Date): Promise<DailyAnalytics[]> {
    return prisma.dailyAnalytics.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async upsert(
    userId: string,
    date: Date,
    data: Prisma.DailyAnalyticsUpdateInput & Prisma.DailyAnalyticsCreateWithoutUserInput
  ): Promise<DailyAnalytics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.dailyAnalytics.upsert({
      where: {
        userId_date: {
          userId,
          date: startOfDay,
        },
      },
      update: data,
      create: {
        ...data,
        date: startOfDay,
        user: { connect: { id: userId } },
      },
    });
  }
}

export const analyticsRepository = new AnalyticsRepository();
