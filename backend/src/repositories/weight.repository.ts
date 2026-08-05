import { prisma } from '../config/prisma.js';
import { WeightLog } from '@prisma/client';

export class WeightRepository {
  async getLatestByUser(userId: string): Promise<WeightLog | null> {
    return prisma.weightLog.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async getHistory(userId: string, limit = 30): Promise<WeightLog[]> {
    return prisma.weightLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async logWeight(userId: string, weight: number, date: Date, notes?: string): Promise<WeightLog> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.weightLog.create({
      data: {
        userId,
        weight,
        date: startOfDay,
        notes,
      },
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await prisma.weightLog.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }
}

export const weightRepository = new WeightRepository();
