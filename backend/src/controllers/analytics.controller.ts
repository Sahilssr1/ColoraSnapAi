import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
  async getTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const period = (req.query.period as string) || 'week';
      const result = await analyticsService.getTrends(userId, period);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logSleep(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { hours, deepHours, date } = req.body;
      const parsedHours = parseFloat(hours);

      if (isNaN(parsedHours) || parsedHours <= 0) {
        res.status(400).json({
          success: false,
          message: 'Please provide valid sleep hours (e.g. 7.5)',
        });
        return;
      }

      const targetDate = date ? new Date(date) : new Date();
      const result = await analyticsService.logSleep(userId, parsedHours, deepHours, targetDate);

      res.status(200).json({
        success: true,
        message: 'Sleep hours logged and score computed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logSteps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { steps, date } = req.body;
      const parsedSteps = parseInt(steps, 10);

      if (isNaN(parsedSteps) || parsedSteps < 0) {
        res.status(400).json({
          success: false,
          message: 'Please provide a valid step count',
        });
        return;
      }

      const targetDate = date ? new Date(date) : new Date();
      const result = await analyticsService.logSteps(userId, parsedSteps, targetDate);

      res.status(200).json({
        success: true,
        message: 'Step count synced successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStepHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string, 10) || 7;
      const result = await analyticsService.getStepHistory(userId, days);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
