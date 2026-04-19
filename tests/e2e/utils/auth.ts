import {APIRequestContext, expect, BrowserContext} from "@playwright/test";

export interface RegisterResult {
    email: string;
    password: string;
    name: string;
}

export async function registerUser(
    request: APIRequestContext,
    overrides: Partial<RegisterResult> = {}
): Promise<RegisterResult> {
    const ts = Date.now() + Math.floor(Math.random() * 1000);
    const data: RegisterResult = {
        name: overrides.name ?? `E2EUser${ts} Customer`,
        email: overrides.email ?? `e2e-customer-${ts}@bakebay.test`,
        password: overrides.password ?? "Test1234!",
    };
    const resp = await request.post("/api/users", {data});
    expect(resp.status(), `register ${data.email}`).toBe(200);
    return data;
}

export async function loginUser(
    request: APIRequestContext,
    email: string,
    password: string
): Promise<void> {
    const resp = await request.post("/api/auth", {data: {email, password}});
    expect(resp.status(), `login ${email}`).toBe(200);
}

export async function loginViaApi(
    context: BrowserContext,
    baseURL: string,
    email: string,
    password: string
): Promise<void> {
    const req = await context.request;
    const resp = await req.post(`${baseURL}/api/auth`, {data: {email, password}});
    expect(resp.status()).toBe(200);
}
