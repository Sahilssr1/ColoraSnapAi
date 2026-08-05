import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { AppError } from './error.middleware.js';
import { logger } from '../config/logger.js';

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// In-memory multer storage for immediate Sharp processing
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, WEBP and HEIC are supported.', 400));
  }
};

export const uploadSingleImage = multer({
  storage,
  limits: {
    fileSize: env.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter,
}).single('image');

export interface ProcessedImageResult {
  filename: string;
  filepath: string;
  buffer: Buffer;
  base64: string;
  width: number;
  height: number;
}

declare global {
  namespace Express {
    interface Request {
      processedImage?: ProcessedImageResult;
    }
  }
}

export const processImageWithSharp = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      return next();
    }

    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const outputFilename = `scan-${uniqueId}.webp`;
    const outputPath = path.join(uploadDir, outputFilename);

    // Resize and compress efficiently for Vision AI models (max 1024x1024)
    const compressedBuffer = await sharp(req.file.buffer)
      .rotate() // auto-orient based on EXIF
      .resize({
        width: 1024,
        height: 1024,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    await fs.promises.writeFile(outputPath, compressedBuffer);
    const metadata = await sharp(compressedBuffer).metadata();

    req.processedImage = {
      filename: outputFilename,
      filepath: outputPath,
      buffer: compressedBuffer,
      base64: compressedBuffer.toString('base64'),
      width: metadata.width || 1024,
      height: metadata.height || 1024,
    };

    logger.debug(`🖼️ Compressed image saved: ${outputPath} (${(compressedBuffer.length / 1024).toFixed(1)} KB)`);
    next();
  } catch (error) {
    logger.error('Sharp image processing error:', error);
    next(new AppError('Failed to process meal image', 500));
  }
};
