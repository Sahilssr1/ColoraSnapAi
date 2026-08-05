import { Router } from 'express';
import { foodController } from '../controllers/food.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/search', (req, res, next) => foodController.search(req, res, next));
router.get('/favorites', (req, res, next) => foodController.getFavorites(req, res, next));
router.post('/favorites/:foodId', (req, res, next) => foodController.toggleFavorite(req, res, next));
router.get('/:id', (req, res, next) => foodController.getById(req, res, next));
router.post('/', (req, res, next) => foodController.create(req, res, next));

export default router;
