import { StatusCodes } from "http-status-codes";

type PostgresError = {
  code?: string;
  message?: string;
  detail?: string;
};

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export const mapDatabaseError = (error: unknown) => {
  const dbError = error as PostgresError;
  console.error('[DB ERROR]', {
    code: dbError.code,
    message: dbError.message,
    detail: dbError.detail,
  });

  if (dbError.code === '23505') {
    return new ApiError(StatusCodes.CONFLICT, 'Username or email is already registered');
  }

  return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Database error');
};