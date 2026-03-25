import { z } from 'zod';
import { REGEX } from '../utils/regex.js';

export const loginSchema = z.object({
  // Applying Email Regex
  email: z.string().regex(REGEX.EMAIL, REGEX.EMAIL_MSG),
  // Applying Password Regex
  password: z.string().regex(
    REGEX.PASSWORD, 
    REGEX.PASSWORD_MSG
  ),
});

export const registerSchema = loginSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  // Refresh token is read from httpOnly cookie in authController, not from request body.
  // Keep a permissive schema so the middleware can still run without blocking valid requests.
});