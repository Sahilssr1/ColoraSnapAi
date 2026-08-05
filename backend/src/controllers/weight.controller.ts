import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';

export class WeightController {
  async logWeight(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { weight, date, notes } = req.body;
      const log = await userService.logWeight(userId, weight, date, notes);
      res.status(201).json({
        success: true,
        message: 'Weight entry logged successfully',
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string, 10) || 30;
      const history = await userService.getWeightHistory(userId, limit);
      res.status(200).json({
        success: true,
        count: history.length,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const weightController = new WeightController();
