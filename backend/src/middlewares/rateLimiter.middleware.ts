import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests created from this IP, please try again after 15 minutes.',
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 20, // stricter for login/register
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

export const aiScanRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 15, // 15 scans per minute per client
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI scanning rate limit exceeded. Please wait a moment before taking another photo.',
  },
});
