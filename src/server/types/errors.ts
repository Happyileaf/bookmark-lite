export class AppError extends Error {
  code: string;
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(
    code: string,
    message: string,
    status = 400,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
