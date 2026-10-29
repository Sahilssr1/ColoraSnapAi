import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { GoalType, ActivityLevel, Gender, User, Goal } from '@prisma/client';
import { nutritionService } from './nutrition.service.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    height: number | null;
    weight: number | null;
    age: number | null;
    gender: Gender;
    goal: GoalType;
    activityLevel: ActivityLevel;
    goals: Goal | null;
  };
  tokens: AuthTokens;
}

export class AuthService {
  private generateAccessToken(user: { id: string; email: string }): string {
    const payload = { userId: user.id, email: user.email };
    return (jwt.sign as any)(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN || '15m',
    });
  }

  private generateRefreshToken(): { token: string; hash: string } {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { token: rawToken, hash: tokenHash };
  }

  async generateAuthTokens(user: { id: string; email: string }): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);
    const { token: refreshToken, hash: refreshHash } = this.generateRefreshToken();

    // 30 days expiration
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await userRepository.saveRefreshToken(user.id, refreshHash, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    };
  }

  async register(params: {
    email: string;
    password?: string;
    name: string;
    height?: number;
    weight?: number;
    age?: number;
    gender?: Gender;
    goal?: GoalType;
    activityLevel?: ActivityLevel;
  }): Promise<AuthResponse> {
    const existing = await userRepository.findByEmail(params.email);
    if (existing) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const hashedPassword = params.password ? await bcrypt.hash(params.password, 10) : null;

    // Calculate baseline recommended goals
    const recommendedMacros = nutritionService.calculateRecommendedMacros({
      weightKg: params.weight ?? 70,
      heightCm: params.height ?? 175,
      age: params.age ?? 25,
      gender: params.gender ?? Gender.OTHER,
      goal: params.goal ?? GoalType.MAINTAIN,
      activityLevel: params.activityLevel ?? ActivityLevel.MODERATE,
    });

    const user = await userRepository.create({
      email: params.email,
      password: hashedPassword,
      name: params.name,
      height: params.height,
      weight: params.weight,
      age: params.age,
      gender: params.gender ?? Gender.OTHER,
      goal: params.goal ?? GoalType.MAINTAIN,
      activityLevel: params.activityLevel ?? ActivityLevel.MODERATE,
      isEmailVerified: false,
      goals: {
        create: recommendedMacros,
      },
    });

    const tokens = await this.generateAuthTokens(user);

    return {
      user: {
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
        goals: user.goals,
      },
      tokens,
    };
  }

  async login(email: string, password?: string): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.password && password) {
      throw new AppError('This account uses Social Login. Please sign in with Google or Apple.', 400);
    }

    if (password && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new AppError('Invalid email or password.', 401);
      }
    }

    const tokens = await this.generateAuthTokens(user);

    return {
      user: {
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
        goals: user.goals,
      },
      tokens,
    };
  }

  async refreshAccessToken(rawRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const storedToken = await userRepository.findRefreshToken(tokenHash);

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token. Please sign in again.', 401);
    }

    // Revoke old token for security (Token Rotation)
    await userRepository.revokeRefreshToken(tokenHash);

    // Issue new pair
    return this.generateAuthTokens(storedToken.user);
  }

  /**
   * Verify a Google ID token with Google before trusting it. The old code
   * accepted any client-supplied googleId/email with no check at all, so
   * anyone could sign in as any user. The token's `sub` becomes googleId
   * and the token's email/name win over client-supplied values.
   */
  private async verifyGoogleIdToken(idToken: string): Promise<{ googleId: string; email: string; name: string; avatar?: string }> {
    if (!env.GOOGLE_WEB_CLIENT_ID) {
      throw new AppError('Google sign-in is not configured on the server: set GOOGLE_WEB_CLIENT_ID (the WEB OAuth client ID) in Render env vars.', 500);
    }
    let tokenInfo: any;
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      tokenInfo = await res.json();
      if (!res.ok) {
        throw new AppError(`Google ID token rejected: ${tokenInfo?.error_description || tokenInfo?.error || res.statusText}`, 401);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Could not verify the Google ID token. Check the server network and try again.', 502);
    }
    if (tokenInfo.aud !== env.GOOGLE_WEB_CLIENT_ID) {
      throw new AppError('Google ID token was issued for a different app (aud mismatch).', 401);
    }
    if (tokenInfo.iss !== 'accounts.google.com' && tokenInfo.iss !== 'https://accounts.google.com') {
      throw new AppError('Google ID token issuer is not Google.', 401);
    }
    if (tokenInfo.exp && Number(tokenInfo.exp) * 1000 < Date.now()) {
      throw new AppError('Google ID token has expired. Sign in again.', 401);
    }
    if (!tokenInfo.sub || !tokenInfo.email) {
      throw new AppError('Google ID token is missing the user id or email.', 401);
    }
    return {
      googleId: tokenInfo.sub,
      email: tokenInfo.email,
      name: tokenInfo.name || 'Calora User',
      avatar: tokenInfo.picture || undefined,
    };
  }

  async googleAuth(payload: { idToken: string; email?: string; name?: string; avatar?: string }): Promise<AuthResponse> {
    const verified = await this.verifyGoogleIdToken(payload.idToken);
    // Prefer the verified token values; fall back to client values only for display.
    const email = verified.email;
    const name = verified.name || payload.name || 'Calora User';
    const avatar = verified.avatar || payload.avatar;
    const googleId = verified.googleId;

    let user = await userRepository.findByGoogleId(googleId);

    if (!user) {
      user = await userRepository.findByEmail(email);
      if (user) {
        user = await userRepository.update(user.id, { googleId, avatar: user.avatar || avatar });
      } else {
        const recommendedMacros = nutritionService.calculateRecommendedMacros({
          weightKg: 70,
          heightCm: 175,
          age: 25,
          gender: Gender.OTHER,
          goal: GoalType.MAINTAIN,
          activityLevel: ActivityLevel.MODERATE,
        });

        user = await userRepository.create({
          email,
          name,
          googleId,
          avatar,
          isEmailVerified: true,
          goals: {
            create: recommendedMacros,
          },
        });
      }
    }

    const tokens = await this.generateAuthTokens(user);
    return {
      user: {
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
        goals: user.goals,
      },
      tokens,
    };
  }

  async appleAuth(payload: { email: string; name?: string; appleId: string }): Promise<AuthResponse> {
    let user = await userRepository.findByAppleId(payload.appleId);

    if (!user) {
      if (payload.email) {
        user = await userRepository.findByEmail(payload.email);
      }
      if (user) {
        user = await userRepository.update(user.id, { appleId: payload.appleId });
      } else {
        const recommendedMacros = nutritionService.calculateRecommendedMacros({
          weightKg: 70,
          heightCm: 175,
          age: 25,
          gender: Gender.OTHER,
          goal: GoalType.MAINTAIN,
          activityLevel: ActivityLevel.MODERATE,
        });

        user = await userRepository.create({
          email: payload.email || `${payload.appleId}@privaterelay.appleid.com`,
          name: payload.name || 'Apple User',
          appleId: payload.appleId,
          isEmailVerified: true,
          goals: {
            create: recommendedMacros,
          },
        });
      }
    }

    const tokens = await this.generateAuthTokens(user);
    return {
      user: {
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
        goals: user.goals,
      },
      tokens,
    };
  }
}

export const authService = new AuthService();
