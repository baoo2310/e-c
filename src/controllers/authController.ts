import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiErrors';
import * as authService from '../services/authService';
import { StatusCodes } from 'http-status-codes';

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