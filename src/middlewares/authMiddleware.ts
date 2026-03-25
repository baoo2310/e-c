import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiErrors';
import { tokenUtils, TokenPayload } from '../utils/tokens';
import { StatusCodes } from 'http-status-codes';

// Extend the Express Request type to include our user payload
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Get the token from the header (Format: "Bearer <token>")
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'You are not logged in. Please provide a valid token.'));
  }

  // 2. Extract just the token string
  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Token not found in authorization header.'));
  }

  try {
    // 3. Verify the token using our utility
    const decoded = tokenUtils.verifyAccessToken(token);

    // 4. Attach the decoded payload (the user ID) to the request object
    req.user = decoded;
    
    // 5. Let the user pass to the controller
    next();
  } catch (error: any) {
    // Handle specific JWT errors nicely
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Your access token has expired. Please refresh it.'));
    }
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token. Please log in again.'));
  }
};

