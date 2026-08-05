import { prisma } from '../config/prisma.js';
import { Goal, Prisma } from '@prisma/client';

export class GoalRepository {
  async findByUserId(userId: string): Promise<Goal | null> {
    return prisma.goal.findUnique({
      where: { userId },
    });
  }

  async upsert(userId: string, data: Prisma.GoalUpdateInput & Prisma.GoalCreateWithoutUserInput): Promise<Goal> {
    return prisma.goal.upsert({
      where: { userId },
      update: data,
      create: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }
}

export const goalRepository = new GoalRepository();
