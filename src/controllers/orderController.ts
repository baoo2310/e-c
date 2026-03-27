import { Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as orderService from '../services/orderService'
import { AuthRequest } from '../middlewares/authMiddleware';
import { StatusCodes } from 'http-status-codes';

export const checkout = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const order = await orderService.checkoutCart(userId);

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    message: 'Order placed successfully',
    data: order
  });
});