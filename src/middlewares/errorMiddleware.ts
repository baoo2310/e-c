import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiErrors';
import { StatusCodes } from 'http-status-codes';
import { ENV } from '../config/env';

export const errorMiddleware = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode, message } = err as any;

  // If it's not a custom ApiError, default to 500
  if (!(err instanceof ApiError)) {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    message = 'Internal Server Error';
  }

  // Log error for the developer (you could use Winston or Morgan here)
  console.error(`[ERROR] ${req.method} ${req.path} >> ${message}`);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    // Only show stack trace in development mode
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
  });
};