/**
 * @jest-environment node
 */
import {
  ForbiddenError,
  UnauthorizedError,
  getAuthPayload,
  requireAdmin,
  requireAuth,
  requireOwnership,
  requireSellerOwnership,
} from "@/lib/auth";

jest.mock("@/app/api/jwt", () => ({
  Decode: jest.fn(),
}));

const sellerSelectMock = jest.fn();

jest.mock("@/src/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: (n: number) => sellerSelectMock(n),
        }),
      }),
    }),
  },
  sellers: { seller_id: "seller_id", user_id: "user_id" },
}));

import { Decode } from "@/app/api/jwt";
const mockedDecode = Decode as jest.MockedFunction<typeof Decode>;

function makeReq(opts: { token?: string; bearer?: string } = {}): Request {
  const headers = new Headers();
  if (opts.token) headers.set("cookie", `auth_token=${opts.token}; foo=bar`);
  if (opts.bearer) headers.set("authorization", `Bearer ${opts.bearer}`);
  return new Request("http://localhost/api/test", { headers });
}

beforeEach(() => {
  mockedDecode.mockReset();
  sellerSelectMock.mockReset();
});

describe("requireAuth", () => {
  it("throws UnauthorizedError when no token present", async () => {
    await expect(requireAuth(makeReq())).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws UnauthorizedError on invalid token", async () => {
    mockedDecode.mockImplementation(() => {
      throw new Error("bad");
    });
    await expect(requireAuth(makeReq({ token: "x" }))).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("returns payload for a valid cookie token", async () => {
    mockedDecode.mockReturnValue({
      userId: 7,
      role: "customer",
      email: "a@b.c",
    } as never);
    const payload = await requireAuth(makeReq({ token: "t" }));
    expect(payload).toEqual({
      userId: 7,
      role: "customer",
      email: "a@b.c",
      sellerId: undefined,
    });
  });

  it("accepts Authorization: Bearer", async () => {
    mockedDecode.mockReturnValue({ userId: 3, role: "admin" } as never);
    const payload = await requireAuth(makeReq({ bearer: "tok" }));
    expect(payload.userId).toBe(3);
    expect(payload.role).toBe("admin");
  });
});

describe("getAuthPayload", () => {
  it("returns null instead of throwing", async () => {
    await expect(getAuthPayload(makeReq())).resolves.toBeNull();
  });
});

describe("requireOwnership", () => {
  it("throws 403 on foreign resource", async () => {
    mockedDecode.mockReturnValue({ userId: 1, role: "customer" } as never);
    await expect(
      requireOwnership(makeReq({ token: "t" }), 999),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("passes for the owner", async () => {
    mockedDecode.mockReturnValue({ userId: 42, role: "customer" } as never);
    const payload = await requireOwnership(makeReq({ token: "t" }), 42);
    expect(payload.userId).toBe(42);
  });

  it("admin bypasses ownership check", async () => {
    mockedDecode.mockReturnValue({ userId: 1, role: "admin" } as never);
    const payload = await requireOwnership(makeReq({ token: "t" }), 999);
    expect(payload.role).toBe("admin");
  });
});

describe("requireAdmin", () => {
  it("rejects non-admin with 403", async () => {
    mockedDecode.mockReturnValue({ userId: 1, role: "customer" } as never);
    await expect(requireAdmin(makeReq({ token: "t" }))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("allows admin", async () => {
    mockedDecode.mockReturnValue({ userId: 1, role: "admin" } as never);
    const payload = await requireAdmin(makeReq({ token: "t" }));
    expect(payload.role).toBe("admin");
  });
});

describe("requireSellerOwnership", () => {
  it("admin bypasses DB lookup", async () => {
    mockedDecode.mockReturnValue({ userId: 1, role: "admin" } as never);
    const payload = await requireSellerOwnership(makeReq({ token: "t" }), 55);
    expect(payload.role).toBe("admin");
    expect(sellerSelectMock).not.toHaveBeenCalled();
  });

  it("uses sellerId from JWT payload without DB call", async () => {
    mockedDecode.mockReturnValue({
      userId: 5,
      role: "seller",
      sellerId: 12,
    } as never);
    const payload = await requireSellerOwnership(makeReq({ token: "t" }), 12);
    expect(payload.sellerId).toBe(12);
    expect(sellerSelectMock).not.toHaveBeenCalled();
  });

  it("throws 403 when JWT sellerId does not match resource", async () => {
    mockedDecode.mockReturnValue({
      userId: 5,
      role: "seller",
      sellerId: 12,
    } as never);
    await expect(
      requireSellerOwnership(makeReq({ token: "t" }), 99),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("falls back to DB lookup when payload lacks sellerId and caches", async () => {
    mockedDecode.mockReturnValue({ userId: 5, role: "seller" } as never);
    sellerSelectMock.mockResolvedValueOnce([{ seller_id: 33 }]);
    const req = makeReq({ token: "t" });
    const payload = await requireSellerOwnership(req, 33);
    expect(payload.sellerId).toBe(33);
    expect(sellerSelectMock).toHaveBeenCalledTimes(1);

    await expect(requireSellerOwnership(req, 33)).resolves.toMatchObject({
      sellerId: 33,
    });
    expect(sellerSelectMock).toHaveBeenCalledTimes(1);
  });

  it("throws 403 when user has no seller record", async () => {
    mockedDecode.mockReturnValue({ userId: 5, role: "customer" } as never);
    sellerSelectMock.mockResolvedValueOnce([]);
    await expect(
      requireSellerOwnership(makeReq({ token: "t" }), 1),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
