import { Request, Response, NextFunction } from 'express';
import { waterService } from '../services/water.service.js';

export class WaterController {
  async logWater(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { amount, date } = req.body;
      const log = await waterService.logWater(userId, amount, date);
      res.status(201).json({
        success: true,
        message: 'Water logged successfully',
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDailyWater(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const dateStr = req.query.date as string;
      const result = await waterService.getDailyWater(userId, dateStr);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteWaterLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await waterService.deleteWaterLog(id, userId);
      res.status(200).json({
        success: true,
        message: 'Water log deleted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const waterController = new WaterController();
