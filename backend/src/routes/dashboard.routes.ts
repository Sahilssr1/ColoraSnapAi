import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', (req, res, next) => dashboardController.getDashboard(req, res, next));

export default router;
