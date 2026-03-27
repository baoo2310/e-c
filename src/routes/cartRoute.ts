import { Router } from 'express';
import { validateRequest } from '../middlewares/validateMiddleware';
import { requireAuth } from '../middlewares/authMiddleware';
import { addItemSchema } from '../validation/cartValidation';
import { addItem, getCart } from '../controllers/cartController';

const router = Router();

router.use(requireAuth);

// Route: POST /api/products
router.post(
  '/items', 
  validateRequest(addItemSchema),  
  addItem                         
);

router.get('/', getCart);

export default router;