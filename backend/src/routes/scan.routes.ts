import { Router } from 'express';
import { scanController } from '../controllers/scan.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { uploadSingleImage, processImageWithSharp } from '../middlewares/upload.middleware.js';
import { aiScanRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { barcodeScanSchema } from '../validators/meal.validator.js';

const router = Router();

router.use(authenticateJwt);

router.post(
  '/image',
  aiScanRateLimiter,
  uploadSingleImage,
  processImageWithSharp,
  (req, res, next) => scanController.scanImage(req, res, next)
);

router.post(
  '/barcode',
  validateRequest(barcodeScanSchema),
  (req, res, next) => scanController.scanBarcode(req, res, next)
);

export default router;
