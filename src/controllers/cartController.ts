import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as cartService from '../services/cartService'
import { AuthRequest } from '../middlewares/authMiddleware';
import { StatusCodes } from 'http-status-codes';

export const addItem = catchAsync(async (req: AuthRequest, res: Response) => {
  // We use the ID attached by the requireAuth middleware to prevent a user 
  // from adding items to someone else's cart by faking a user_id in the body.
  const userId = req.user!.id; 

  const cart = await cartService.addItemToCart(userId, req.body);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Item added to cart successfully',
    data: cart
  });
});

export const getCart = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id; 

  const cart = await cartService.getCart(userId);

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: cart
  });
});