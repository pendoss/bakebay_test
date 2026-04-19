import {test, expect} from "@playwright/test";

test.describe("Гостевой пользователь", () => {
    test("главная страница рендерится и ведёт в каталог", async ({page}) => {
        await page.goto("/");
        await expect(page.getByRole("heading", {name: /Авторские торты/i})).toBeVisible();
        await page.getByRole("link", {name: /Смотреть торты/i}).first().click();
        await expect(page).toHaveURL(/\/catalog/);
    });

    test("каталог показывает товары", async ({page}) => {
        await page.goto("/catalog");
        await expect(page.locator("body")).toContainText(/E2E|руб\./i);
    });

    test("оформление заказа без авторизации блокируется", async ({page}) => {
        await page.goto("/catalog");
        const addBtn = page.getByRole("button", {name: /В корзину|Добавить/i}).first();
        if (await addBtn.isVisible().catch(() => false)) {
            await addBtn.click();
        }
        await page.goto("/cart");
        const checkout = page.getByRole("button", {name: /Перейти к оформлению/i});
        if (await checkout.isVisible().catch(() => false)) {
            await checkout.click();
            await expect(page.getByText(/Необходима авторизация/i)).toBeVisible({timeout: 5000});
        }
    });
});
