import { waterRepository } from '../repositories/water.repository.js';
import { goalRepository } from '../repositories/goal.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export class WaterService {
  async logWater(userId: string, amount: number, dateStr?: string) {
    if (amount <= 0 || amount > 5000) {
      throw new AppError('Water amount must be between 10ml and 5000ml', 400);
    }
    const date = dateStr ? new Date(dateStr) : new Date();
    return waterRepository.addLog(userId, amount, date);
  }

  async getDailyWater(userId: string, dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const logs = await waterRepository.findByUserAndDate(userId, date);
    const total = logs.reduce((sum, log) => sum + log.amount, 0);

    const goal = await goalRepository.findByUserId(userId);
    const target = goal?.targetWater || 2500;

    return {
      date: date.toISOString().split('T')[0],
      totalAmount: total,
      targetAmount: target,
      percentage: Math.min(100, Math.round((total / target) * 100)),
      remainingAmount: Math.max(0, target - total),
      logs,
    };
  }

  async deleteWaterLog(id: string, userId: string) {
    const deleted = await waterRepository.deleteLog(id, userId);
    if (!deleted) {
      throw new AppError('Water log entry not found', 404);
    }
    return { success: true };
  }
}

export const waterService = new WaterService();
