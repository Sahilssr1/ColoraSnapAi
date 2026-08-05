import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { updateProfileSchema, updateGoalsSchema } from '../validators/meal.validator.js';

const router = Router();

router.use(authenticateJwt);

router.get('/profile', (req, res, next) => userController.getProfile(req, res, next));
router.put('/profile', validateRequest(updateProfileSchema), (req, res, next) =>
  userController.updateProfile(req, res, next)
);
router.put('/goals', validateRequest(updateGoalsSchema), (req, res, next) =>
  userController.updateGoals(req, res, next)
);

export default router;
