import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/shared/errors/app-error';
import { ValidationError } from '@/shared/errors/validation-error';
import { logger } from '@/shared/logger/logger';
import { errorResponse } from '@/shared/dto/response.dto';
import { env } from '@/config/env';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationError = new ValidationError(err);
    res.status(validationError.statusCode).json(
      errorResponse(validationError.code, validationError.message, validationError.errors),
    );
    return;
  }

  // Handle AppError (custom operational errors)
  if (err instanceof AppError) {
    const response: any = errorResponse(err.code, err.message);
    if (err instanceof ValidationError) {
      response.error.errors = err.errors;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json(errorResponse('INVALID_TOKEN', 'Invalid token'));
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json(errorResponse('TOKEN_EXPIRED', 'Token has expired'));
    return;
  }

  // Handle TypeORM errors
  if (err.name === 'QueryFailedError') {
    const pgError = err as any;
    if (pgError.code === '23505') {
      res.status(409).json(errorResponse('DUPLICATE_ENTRY', 'Resource already exists'));
      return;
    }
    if (pgError.code === '23503') {
      res.status(400).json(errorResponse('REFERENCE_ERROR', 'Referenced resource does not exist'));
      return;
    }
  }

  // Unexpected error
  logger.error({ err }, 'Unexpected error');

  const statusCode = env.NODE_ENV === 'production' ? 500 : undefined;
  const message =
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error';

  res.status(statusCode || 500).json(errorResponse('INTERNAL_ERROR', message));
}
