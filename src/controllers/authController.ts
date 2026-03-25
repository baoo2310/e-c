import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiErrors';
import * as authService from '../services/authService';
import { StatusCodes } from 'http-status-codes';
import { formatters } from '../utils/formatter';
import { AuthRequest } from '../middlewares/authMiddleware';

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  // EARLY RETURN 1: Check if user already exists (Simulated check)
  const userExists = await authService.findUserByEmail(email);
  if (userExists) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered');
  }

  const newUser = await authService.createUser(req.body);

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    data: newUser
  });
});

export const getProfile = catchAsync(async (req: Request, res: Response)=>  {
  const { id } = req.params;
  if(!id) throw new ApiError(StatusCodes.CONFLICT, 'Id is required!')
  const user = await authService.getUserProfile(id);
  res.status(StatusCodes.OK).json({
    status: 'success',
    data: user
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const cleanEmail = formatters.formatEmail(email);

  const result = await authService.loginUser({
    email: cleanEmail, password,
  });
  
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,    // Prevents JS access (XSS protection)
    secure: process.env.NODE_ENV === 'production', // Only sends over HTTPS
    sameSite: 'strict', // Prevents CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  });

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Logged in successfully',
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const cookieToken = req.cookies.refreshToken;

  if (!cookieToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token missing');
  }

  const tokens = await authService.refreshUserToken(cookieToken);

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Tokens refreshed successfully',
    data: { accessToken: tokens.accessToken }
  });
});

export const logout = catchAsync(async (req: AuthRequest, res: Response) => {
  // req.user was attached by our requireAuth middleware
  const userId = req.user?.id;

  if (userId) {
    await authService.logoutUser(userId);
  }

  res.clearCookie('refreshToken');

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});