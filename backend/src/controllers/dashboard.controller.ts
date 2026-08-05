import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service.js';

export class DashboardController {
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const dateStr = req.query.date as string;
      const targetDate = dateStr ? new Date(dateStr) : new Date();

      const dashboard = await analyticsService.getDashboard(userId, targetDate);
      res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
