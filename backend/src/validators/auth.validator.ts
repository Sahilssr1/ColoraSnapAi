import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    height: z.number().positive().optional(),
    weight: z.number().positive().optional(),
    age: z.number().int().min(10).max(120).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    goal: z.enum(['LOSE_WEIGHT', 'MAINTAIN', 'GAIN_WEIGHT']).optional(),
    activityLevel: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE', 'EXTRA_ACTIVE']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const googleAuthSchema = z.object({
  body: z.object({
    // The ID token from Google Sign-In. The backend verifies it with Google;
    // a bare googleId/email pair is no longer accepted (it was unverified).
    idToken: z.string().min(1, 'Google ID token is required'),
    email: z.string().email('Invalid email address').optional(),
    name: z.string().min(1, 'Name is required').optional(),
    avatar: z.string().url().optional(),
  }),
});

export const appleAuthSchema = z.object({
  body: z.object({
    appleId: z.string().min(1, 'Apple ID is required'),
    email: z.string().email().optional(),
    name: z.string().optional(),
  }),
});
