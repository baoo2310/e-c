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
})