import { Router } from 'express';
import { mealController } from '../controllers/meal.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { logMealSchema } from '../validators/meal.validator.js';

const router = Router();

router.use(authenticateJwt);

router.post('/', validateRequest(logMealSchema), (req, res, next) => mealController.logMeal(req, res, next));
router.get('/today', (req, res, next) => mealController.getTodayMeals(req, res, next));
router.get('/history', (req, res, next) => mealController.getMealHistory(req, res, next));
router.get('/recent', (req, res, next) => mealController.getRecentFoods(req, res, next));
router.delete('/:id', (req, res, next) => mealController.deleteMeal(req, res, next));

export default router;
