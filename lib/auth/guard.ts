import { eq } from "drizzle-orm";
import { db, sellers } from "@/src/db";
import { Decode } from "@/app/api/jwt";
import { ForbiddenError, UnauthorizedError } from "./errors";

export type AuthRole = "customer" | "admin" | "seller";

export type AuthPayload = {
  userId: number;
  email: string;
  role: AuthRole;
  sellerId?: number;
};

type RawJwtPayload = {
  userId: number;
  role?: string;
  email?: string;
  sellerId?: number;
};

const sellerIdCache = new WeakMap<Request, number | null>();

function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.split("=");
    if (!rawKey) continue;
    const key = rawKey.trim();
    if (!key) continue;
    out[key] = decodeURIComponent(rest.join("=").trim());
  }
  return out;
}

function extractToken(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (auth) {
    const match = auth.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1].trim();
  }
  const cookies = parseCookieHeader(req.headers.get("cookie"));
  return cookies["auth_token"] ?? null;
}

function normalizeRole(role: string | undefined): AuthRole {
  if (role === "admin" || role === "seller") return role;
  return "customer";
}

/**
 * Reads a JWT from cookie or `Authorization: Bearer` header, validates it, and
 * returns the payload. Throws {@link UnauthorizedError} on missing/invalid token.
 *
 * @example
 *   export async function GET(req: Request) {
 *     const auth = await requireAuth(req);
 *     return NextResponse.json({ userId: auth.userId });
 *   }
 */
export async function requireAuth(req: Request): Promise<AuthPayload> {
  const token = extractToken(req);
  if (!token) throw new UnauthorizedError();
  let raw: RawJwtPayload;
  try {
    raw = Decode(token) as RawJwtPayload;
  } catch {
    throw new UnauthorizedError("Invalid token");
  }
  if (!raw || typeof raw.userId !== "number") {
    throw new UnauthorizedError("Invalid token");
  }
  return {
    userId: raw.userId,
    email: raw.email ?? "",
    role: normalizeRole(raw.role),
    sellerId: typeof raw.sellerId === "number" ? raw.sellerId : undefined,
  };
}

/**
 * Returns the authenticated payload or `null` when no/invalid token is present.
 * Use for endpoints where auth is optional (e.g. public listings that enrich
 * the response for logged-in users).
 */
export async function getAuthPayload(req: Request): Promise<AuthPayload | null> {
  try {
    return await requireAuth(req);
  } catch {
    return null;
  }
}

/**
 * Requires the caller to be either the owner of the resource (userId match) or
 * an admin. Throws {@link ForbiddenError} otherwise.
 *
 * @example
 *   const auth = await requireOwnership(req, order.user_id);
 */
export async function requireOwnership(
  req: Request,
  userId: number,
): Promise<AuthPayload> {
  const auth = await requireAuth(req);
  if (auth.role === "admin") return auth;
  if (auth.userId !== userId) {
    throw new ForbiddenError("Недостаточно прав");
  }
  return auth;
}

async function resolveSellerIdForUser(userId: number): Promise<number | null> {
  const rows = await db
    .select({ seller_id: sellers.seller_id })
    .from(sellers)
    .where(eq(sellers.user_id, userId))
    .limit(1);
  return rows[0]?.seller_id ?? null;
}

/**
 * Requires the caller to own the seller (sellers.user_id === payload.userId and
 * seller_id matches), or be an admin. Caches the lookup per-request. Throws
 * {@link ForbiddenError} otherwise.
 */
export async function requireSellerOwnership(
  req: Request,
  sellerId: number,
): Promise<AuthPayload> {
  const auth = await requireAuth(req);
  if (auth.role === "admin") return auth;

  let ownedSellerId: number | null | undefined = auth.sellerId ?? null;
  if (!ownedSellerId) {
    ownedSellerId = sellerIdCache.get(req) ?? undefined;
    if (ownedSellerId === undefined) {
      ownedSellerId = await resolveSellerIdForUser(auth.userId);
      sellerIdCache.set(req, ownedSellerId);
    }
  }

  if (!ownedSellerId || ownedSellerId !== sellerId) {
    throw new ForbiddenError("Недостаточно прав");
  }
  return { ...auth, sellerId: ownedSellerId };
}

/**
 * Requires the caller to have the `admin` role.
 */
export async function requireAdmin(req: Request): Promise<AuthPayload> {
  const auth = await requireAuth(req);
  if (auth.role !== "admin") {
    throw new ForbiddenError("Недостаточно прав");
  }
  return auth;
}
