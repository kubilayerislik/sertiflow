import { handleApiError } from './response';

export type RouteContext = { params: Promise<Record<string, string>> };

export function withHandler(
  handler: (request: Request, context: RouteContext) => Promise<Response>,
) {
  return async (request: Request, context: RouteContext) => {
    try {
      return await handler(request, context);
    } catch (e) {
      return handleApiError(e);
    }
  };
}
