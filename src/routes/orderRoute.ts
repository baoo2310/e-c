import { Router } from 'express';
import { checkout } from '../controllers/orderController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth);

// POST /api/orders/checkout
router.post('/checkout', checkout);

export default router;