import { Router } from 'express';
import { waterController } from '../controllers/water.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { logWaterSchema } from '../validators/meal.validator.js';

const router = Router();

router.use(authenticateJwt);

router.post('/', validateRequest(logWaterSchema), (req, res, next) => waterController.logWater(req, res, next));
router.get('/', (req, res, next) => waterController.getDailyWater(req, res, next));
router.delete('/:id', (req, res, next) => waterController.deleteWaterLog(req, res, next));

export default router;
