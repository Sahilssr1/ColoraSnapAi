import { Router } from 'express';
import { weightController } from '../controllers/weight.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { logWeightSchema } from '../validators/meal.validator.js';

const router = Router();

router.use(authenticateJwt);

router.post('/', validateRequest(logWeightSchema), (req, res, next) => weightController.logWeight(req, res, next));
router.get('/history', (req, res, next) => weightController.getHistory(req, res, next));

export default router;
