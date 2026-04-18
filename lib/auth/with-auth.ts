import { NextResponse } from "next/server";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { requireAuth, type AuthPayload } from "./guard";

type Handler<T> = (
  req: Request,
  ctx: { auth: AuthPayload },
) => Promise<T>;

/**
 * Wraps an App Router handler so it only runs for authenticated requests and
 * automatically translates {@link UnauthorizedError} / {@link ForbiddenError}
 * into 401/403 JSON responses.
 *
 * @example
 *   export const GET = withAuth(async (_req, { auth }) => {
 *     return NextResponse.json({ userId: auth.userId });
 *   });
 */
export function withAuth<T>(
  handler: Handler<T>,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    try {
      const auth = await requireAuth(req);
      const result = await handler(req, { auth });
      if (result instanceof Response) return result;
      return NextResponse.json(result as unknown);
    } catch (err) {
      if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
        return NextResponse.json(
          { error: err.message },
          { status: err.status },
        );
      }
      throw err;
    }
  };
}
