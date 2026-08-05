import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', (req, res, next) => analyticsController.getTrends(req, res, next));
router.get('/steps/history', (req, res, next) => analyticsController.getStepHistory(req, res, next));
router.post('/sleep', (req, res, next) => analyticsController.logSleep(req, res, next));
router.post('/steps', (req, res, next) => analyticsController.logSteps(req, res, next));

export default router;
