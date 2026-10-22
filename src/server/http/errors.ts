export class ApiError extends Error {
  readonly status: number;
  readonly body: { message: string | Record<string, unknown> };

  constructor(status: number, message: string | Record<string, unknown>) {
    super(typeof message === 'string' ? message : 'İstek başarısız');
    this.status = status;
    this.body = { message };
  }
}

export function badRequest(message: string) {
  return new ApiError(400, message);
}

export function unauthorized() {
  return new ApiError(401, 'Unauthorized');
}

export function forbidden(message: string) {
  return new ApiError(403, message);
}

export function notFound() {
  return new ApiError(404, 'Not Found');
}

export function conflict(message: string | Record<string, unknown>) {
  return new ApiError(409, message);
}

export function tooManyRequests(message: string) {
  return new ApiError(429, message);
}

export function serviceUnavailable(body: Record<string, unknown>) {
  return new ApiError(503, body);
}
