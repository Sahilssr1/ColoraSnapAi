import { prisma } from '../config/prisma.js';
import { WaterLog } from '@prisma/client';

export class WaterRepository {
  async findByUserAndDate(userId: string, date: Date): Promise<WaterLog[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.waterLog.findMany({
      where: {
        userId,
        date: startOfDay,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTotalWaterForDate(userId: string, date: Date): Promise<number> {
    const logs = await this.findByUserAndDate(userId, date);
    return logs.reduce((sum, log) => sum + log.amount, 0);
  }

  async addLog(userId: string, amount: number, date: Date): Promise<WaterLog> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.waterLog.create({
      data: {
        userId,
        amount,
        date: startOfDay,
      },
    });
  }

  async deleteLog(id: string, userId: string): Promise<boolean> {
    const result = await prisma.waterLog.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }
}

export const waterRepository = new WaterRepository();
