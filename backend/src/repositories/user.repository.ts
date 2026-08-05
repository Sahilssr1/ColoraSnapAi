import { prisma } from '../config/prisma.js';
import { User, Goal, Prisma } from '@prisma/client';

export class UserRepository {
  async findById(id: string): Promise<(User & { goals: Goal | null }) | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { goals: true },
    });
  }

  async findByEmail(email: string): Promise<(User & { goals: Goal | null }) | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { goals: true },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { googleId },
      include: { goals: true },
    });
  }

  async findByAppleId(appleId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { appleId },
      include: { goals: true },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User & { goals: Goal | null }> {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
      },
      include: { goals: true },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User & { goals: Goal | null }> {
    return prisma.user.update({
      where: { id },
      data,
      include: { goals: true },
    });
  }

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async revokeRefreshToken(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }
}

export const userRepository = new UserRepository();
