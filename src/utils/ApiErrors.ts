import { StatusCodes } from "http-status-codes";

export type PostgresError = {
  code?: string;
  constraint?: string;
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
    constraint: dbError.constraint,
    message: dbError.message,
    detail: dbError.detail,
  });

  if (dbError.code === '23505') {
    if (dbError.constraint === 'users_email_key') {
      return new ApiError(StatusCodes.CONFLICT, 'Email is already registered');
    }

    if (dbError.constraint === 'users_username_key') {
      return new ApiError(StatusCodes.CONFLICT, 'Username is already taken');
    }

    return new ApiError(StatusCodes.CONFLICT, 'Duplicate value violates a unique constraint');
  }

  if (dbError.code === '23503') {
    return new ApiError(StatusCodes.BAD_REQUEST, 'Referenced resource does not exist');
  }

  if (dbError.code === '22P02') {
    return new ApiError(StatusCodes.BAD_REQUEST, 'Invalid input format');
  }

  return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Database error');
};