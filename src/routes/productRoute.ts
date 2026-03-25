import { Router } from 'express';
import { createProduct, getProducts } from '../controllers/productController';
import { validateRequest } from '../middlewares/validateMiddleware';
import { createProductSchema, getProductsQuerySchema } from '../validation/productValidation';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get(
  '/', 
  validateRequest(getProductsQuerySchema, 'query'), 
  getProducts
);

// Route: POST /api/products
router.post(
  '/', 
  requireAuth,                           // 1. Ensure user is logged in
  validateRequest(createProductSchema),  // 2. Validate Product & SKUs format
  createProduct                          // 3. Execute Transaction
);

export default router;