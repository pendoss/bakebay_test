/**
 * @jest-environment node
 */
import { ForbiddenError, UnauthorizedError, withAuth } from "@/lib/auth";

jest.mock("@/app/api/jwt", () => ({
  Decode: jest.fn(),
}));
jest.mock("@/src/db", () => ({
  db: {},
  sellers: { seller_id: "seller_id", user_id: "user_id" },
}));

import { Decode } from "@/app/api/jwt";
const mockedDecode = Decode as jest.MockedFunction<typeof Decode>;

function makeReq(token?: string): Request {
  const headers = new Headers();
  if (token) headers.set("cookie", `auth_token=${token}`);
  return new Request("http://localhost/api/x", { headers });
}

beforeEach(() => {
  mockedDecode.mockReset();
});

describe("withAuth", () => {
  it("returns 401 JSON when request is unauthenticated", async () => {
    const handler = withAuth(async () => ({ ok: true }));
    const res = await handler(makeReq());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toHaveProperty("error");
  });

  it("invokes handler with auth payload when authenticated", async () => {
    mockedDecode.mockReturnValue({ userId: 9, role: "customer" } as never);
    const handler = withAuth(async (_req, { auth }) => ({ id: auth.userId }));
    const res = await handler(makeReq("t"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ id: 9 });
  });

  it("translates ForbiddenError to 403", async () => {
    mockedDecode.mockReturnValue({ userId: 1, role: "customer" } as never);
    const handler = withAuth(async () => {
      throw new ForbiddenError("nope");
    });
    const res = await handler(makeReq("t"));
    expect(res.status).toBe(403);
  });

  it("rethrows non-auth errors", async () => {
    mockedDecode.mockReturnValue({ userId: 1, role: "customer" } as never);
    const handler = withAuth(async () => {
      throw new Error("boom");
    });
    await expect(handler(makeReq("t"))).rejects.toThrow("boom");
  });

  it("propagates UnauthorizedError thrown from handler", async () => {
    mockedDecode.mockReturnValue({ userId: 1, role: "customer" } as never);
    const handler = withAuth(async () => {
      throw new UnauthorizedError("reauth");
    });
    const res = await handler(makeReq("t"));
    expect(res.status).toBe(401);
  });
});
