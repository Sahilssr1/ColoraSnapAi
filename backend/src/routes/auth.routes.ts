import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  googleAuthSchema,
  appleAuthSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authRateLimiter, validateRequest(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/login', authRateLimiter, validateRequest(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post('/refresh', validateRequest(refreshTokenSchema), (req, res, next) =>
  authController.refreshToken(req, res, next)
);

router.post('/google', validateRequest(googleAuthSchema), (req, res, next) =>
  authController.googleAuth(req, res, next)
);

router.post('/apple', validateRequest(appleAuthSchema), (req, res, next) =>
  authController.appleAuth(req, res, next)
);

export default router;
