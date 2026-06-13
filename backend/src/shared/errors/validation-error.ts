import { ZodError, ZodIssue } from 'zod';
import { AppError } from '@/shared/errors/app-error';

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(zodError: ZodError) {
    const errors = formatZodErrors(zodError);
    super('Validation failed', 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class SimpleValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super('Validation failed', 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

function formatZodErrors(zodError: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of zodError.issues) {
    const path = issue.path.join('.') || 'root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}
