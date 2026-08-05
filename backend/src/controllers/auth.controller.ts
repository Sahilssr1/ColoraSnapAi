import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshAccessToken(refreshToken);
      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.googleAuth(req.body);
      res.status(200).json({
        success: true,
        message: 'Google authentication successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async appleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.appleAuth(req.body);
      res.status(200).json({
        success: true,
        message: 'Apple authentication successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
