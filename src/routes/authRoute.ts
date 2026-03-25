import { Router } from 'express';
import { getProfile, login, refreshToken, register } from '../controllers/authController';
import { validateRequest } from '../middlewares/validateMiddleware';
import { loginSchema, refreshTokenSchema, registerSchema } from '../validation/authValidation';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Flow: Request -> Middleware (Validation) -> Controller
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.get('/profile/:id', requireAuth, getProfile);
router.post('/refresh-token', validateRequest(refreshTokenSchema), refreshToken);

export default router;