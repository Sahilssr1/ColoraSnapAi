import { prisma } from '../config/prisma.js';
import { Food, Prisma } from '@prisma/client';

export class FoodRepository {
  async findById(id: string): Promise<Food | null> {
    return prisma.food.findUnique({
      where: { id },
    });
  }

  async findByBarcode(barcode: string): Promise<Food | null> {
    return prisma.food.findUnique({
      where: { barcode },
    });
  }

  async search(query: string, limit = 20): Promise<Food[]> {
    return prisma.food.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { calories: 'desc' },
    });
  }

  async create(data: Prisma.FoodCreateInput): Promise<Food> {
    return prisma.food.create({
      data,
    });
  }

  async upsertByBarcode(barcode: string, data: Prisma.FoodCreateInput): Promise<Food> {
    return prisma.food.upsert({
      where: { barcode },
      update: data,
      create: data,
    });
  }

  async getUserFavorites(userId: string): Promise<Food[]> {
    const favorites = await prisma.favoriteFood.findMany({
      where: { userId },
      include: { food: true },
      orderBy: { createdAt: 'desc' },
    });
    return favorites.map((f) => f.food);
  }

  async addFavorite(userId: string, foodId: string) {
    return prisma.favoriteFood.create({
      data: { userId, foodId },
    });
  }

  async removeFavorite(userId: string, foodId: string) {
    return prisma.favoriteFood.deleteMany({
      where: { userId, foodId },
    });
  }

  async isFavorite(userId: string, foodId: string): Promise<boolean> {
    const count = await prisma.favoriteFood.count({
      where: { userId, foodId },
    });
    return count > 0;
  }
}

export const foodRepository = new FoodRepository();
