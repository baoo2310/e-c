import { Router } from 'express';
import { register } from '../controllers/authController';
import { validateRequest } from '../middlewares/validateMiddleware';
import { registerSchema } from '../validation/authValidation';

const router = Router();

// Flow: Request -> Middleware (Validation) -> Controller
router.post('/register', validateRequest(registerSchema), register);

export default router;