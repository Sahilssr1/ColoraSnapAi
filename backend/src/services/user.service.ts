import { userRepository } from '../repositories/user.repository.js';
import { goalRepository } from '../repositories/goal.repository.js';
import { weightRepository } from '../repositories/weight.repository.js';
import { nutritionService } from './nutrition.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { GoalType, ActivityLevel, Gender, Prisma } from '@prisma/client';

export class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User profile not found', 404);
    }

    const latestWeight = await weightRepository.getLatestByUser(userId);
    const weight = latestWeight?.weight ?? user.weight ?? 70;
    const height = user.height ?? 175;
    const age = user.age ?? 25;
    const gender = user.gender;

    const bmr = nutritionService.calculateBmr(weight, height, age, gender);
    const bmiData = nutritionService.calculateBmi(weight, height);
    const tdee = nutritionService.calculateTdee(bmr, user.activityLevel);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      height: user.height,
      weight: user.weight,
      age: user.age,
      gender: user.gender,
      goal: user.goal,
      activityLevel: user.activityLevel,
      bmr,
      bmi: bmiData.bmi,
      bmiCategory: bmiData.category,
      tdee,
      goals: user.goals,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      avatar?: string;
      height?: number;
      weight?: number;
      age?: number;
      gender?: Gender;
      goal?: GoalType;
      activityLevel?: ActivityLevel;
    }
  ) {
    const updated = await userRepository.update(userId, data);

    // If biometric stats or goal changed, recalculate goals
    if (data.height || data.weight || data.age || data.gender || data.goal || data.activityLevel) {
      const recalculated = nutritionService.calculateRecommendedMacros({
        weightKg: data.weight ?? updated.weight ?? 70,
        heightCm: data.height ?? updated.height ?? 175,
        age: data.age ?? updated.age ?? 25,
        gender: data.gender ?? updated.gender ?? Gender.OTHER,
        goal: data.goal ?? updated.goal ?? GoalType.MAINTAIN,
        activityLevel: data.activityLevel ?? updated.activityLevel ?? ActivityLevel.MODERATE,
      });

      await goalRepository.upsert(userId, recalculated);
    }

    return this.getProfile(userId);
  }

  async updateGoals(userId: string, goals: Prisma.GoalUpdateInput & Prisma.GoalCreateWithoutUserInput) {
    return goalRepository.upsert(userId, goals);
  }

  async logWeight(userId: string, weight: number, dateStr?: string, notes?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const log = await weightRepository.logWeight(userId, weight, date, notes);
    await userRepository.update(userId, { weight });
    return log;
  }

  async getWeightHistory(userId: string, limit = 30) {
    return weightRepository.getHistory(userId, limit);
  }

  async deleteAccount(userId: string) {
    return userRepository.delete(userId);
  }
}

export const userService = new UserService();

