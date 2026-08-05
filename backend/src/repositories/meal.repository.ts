import { prisma } from '../config/prisma.js';
import { MealLog, MealType, Prisma } from '@prisma/client';

export class MealRepository {
  async findById(id: string): Promise<(MealLog & { food: Prisma.FoodGetPayload<object> }) | null> {
    return prisma.mealLog.findUnique({
      where: { id },
      include: { food: true },
    });
  }

  async findByUserAndDate(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.mealLog.findMany({
      where: {
        userId,
        date: startOfDay,
      },
      include: { food: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByUserDateRange(userId: string, startDate: Date, endDate: Date) {
    return prisma.mealLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { food: true },
      orderBy: { date: 'asc' },
    });
  }

  async create(data: {
    userId: string;
    foodId: string;
    mealType: MealType;
    quantity: number;
    servingSize: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    date: Date;
  }): Promise<MealLog & { food: Prisma.FoodGetPayload<object> }> {
    const formattedDate = new Date(data.date);
    formattedDate.setHours(0, 0, 0, 0);

    return prisma.mealLog.create({
      data: {
        ...data,
        date: formattedDate,
      },
      include: { food: true },
    });
  }

  async update(id: string, userId: string, data: Prisma.MealLogUpdateInput) {
    return prisma.mealLog.updateMany({
      where: { id, userId },
      data,
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await prisma.mealLog.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }

  async getRecentUniqueFoods(userId: string, limit = 10) {
    const logs = await prisma.mealLog.findMany({
      where: { userId },
      distinct: ['foodId'],
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { food: true },
    });
    return logs.map((log) => log.food);
  }
}

export const mealRepository = new MealRepository();
