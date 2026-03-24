import { z, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export const validateRequest = (schema: z.ZodType<unknown>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          errors: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
  };
};