export const REGEX = {
  // Matches standard email format (name@domain.com)
  EMAIL: /^[a-zA-Z0-0._%+-]+@[a-zA-Z0-0.-]+\.[a-zA-Z]{2,}$/,
  EMAIL_MSG: 'Invalid email format, please try mymail@example.com',

  /**
   * Password Requirements:
   * - Minimum 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character (@$!%*?&)
   */
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PASSWORD_MSG: 'Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character'
};