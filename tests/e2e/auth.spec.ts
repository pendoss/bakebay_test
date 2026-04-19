import {test, expect} from "@playwright/test";
import {registerUser} from "./utils/auth";

test.describe("Регистрация и аутентификация", () => {
    test("API: регистрация уникального пользователя", async ({request}) => {
        const ts = Date.now();
        const data = {
            name: `E2E${ts} Customer`,
            email: `e2e-customer-${ts}@bakebay.test`,
            password: "Test1234!",
        };
        const resp = await request.post("/api/users", {data});
        expect(resp.status()).toBe(200);
    });

    test("API: регистрация без фамилии — 400", async ({request}) => {
        const resp = await request.post("/api/users", {
            data: {name: "OnlyFirst", email: `bad-${Date.now()}@bakebay.test`, password: "Test1234!"},
        });
        expect(resp.status()).toBe(400);
    });

    test("API: логин с неверным паролем — 401", async ({request}) => {
        const created = await registerUser(request);
        const resp = await request.post("/api/auth", {
            data: {email: created.email, password: "wrong-password"},
        });
        expect(resp.status()).toBe(401);
    });

    test("UI: вход через диалог + logout", async ({page}) => {
        const user = await registerUser(page.request);

        await page.goto("/");
        // user-nav кнопка-аватар — единственная кнопка с rounded-full в хедере
        await page.locator("button.rounded-full").first().click();
        await page.getByRole("menuitem", {name: /Войти/i}).click();
        await page.getByLabel("Email").fill(user.email);
        await page.getByLabel(/^Пароль$/).fill(user.password);
        await page.getByRole("button", {name: /^Войти$/}).click();

        await expect(page.getByText(/Добро пожаловать/i).first()).toBeVisible({timeout: 10_000});

        await page.locator("button.rounded-full").first().click();
        await page.getByRole("menuitem", {name: /Выйти/i}).click();
        await expect(page).toHaveURL(/\/$/);
    });

    test("Cookie auth_token устанавливается после логина", async ({page}) => {
        const user = await registerUser(page.request);
        await page.request.post("/api/auth", {data: {email: user.email, password: user.password}});
        const cookies = await page.context().cookies();
        expect(cookies.find(c => c.name === "auth_token")).toBeTruthy();
    });
});
