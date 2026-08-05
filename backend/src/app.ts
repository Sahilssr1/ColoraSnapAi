import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

import { env } from './config/env.js';
import { swaggerDocument } from './config/swagger.js';
import { apiRateLimiter } from './middlewares/rateLimiter.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import scanRoutes from './routes/scan.routes.js';
import foodRoutes from './routes/food.routes.js';
import mealRoutes from './routes/meal.routes.js';
import waterRoutes from './routes/water.routes.js';
import weightRoutes from './routes/weight.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

export const createApp = (): Express => {
  const app = express();

  // Security headers & compression
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(compression());

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Request body parsing
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // HTTP Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Static uploads directory
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

  // Global API Rate Limiter
  app.use(env.API_PREFIX, apiRateLimiter);

  // Swagger UI API Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Health Check Endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      app: 'Calora AI API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // REST API Routes
  app.use(`${env.API_PREFIX}/auth`, authRoutes);
  app.use(`${env.API_PREFIX}/user`, userRoutes);
  app.use(`${env.API_PREFIX}/scan`, scanRoutes);
  app.use(`${env.API_PREFIX}/foods`, foodRoutes);
  app.use(`${env.API_PREFIX}/meal`, mealRoutes);
  app.use(`${env.API_PREFIX}/water`, waterRoutes);
  app.use(`${env.API_PREFIX}/weight`, weightRoutes);
  app.use(`${env.API_PREFIX}/dashboard`, dashboardRoutes);
  app.use(`${env.API_PREFIX}/analytics`, analyticsRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
