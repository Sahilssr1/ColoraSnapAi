import { Request, Response, NextFunction } from 'express';
import { aiVisionService } from '../services/aiVision.service.js';
import { barcodeService } from '../services/barcode.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export class ScanController {
  async scanImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.processedImage) {
        throw new AppError('No meal image uploaded. Please provide a photo of the food.', 400);
      }

      const scanResult = await aiVisionService.scanFoodImage(
        req.processedImage.base64,
        'image/webp'
      );

      // Automatically store in foods database for instant logging
      const savedFood = await aiVisionService.saveScannedFoodToDatabase(scanResult.primaryFood);

      res.status(200).json({
        success: true,
        message: 'Food scanned and nutrition estimated successfully',
        data: {
          ...scanResult,
          savedFoodId: savedFood.id,
          savedFood,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async scanBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { barcode } = req.body;
      const result = await barcodeService.lookupBarcode(barcode);

      if (!result.found) {
        res.status(200).json({
          success: false,
          message: 'Product not found in OpenFoodFacts or USDA database. Please take a photo with the AI Food Scanner.',
          suggestPhotoScan: true,
          barcode,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Barcode lookup successful',
        data: {
          food: result.food,
          source: result.source,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const scanController = new ScanController();
