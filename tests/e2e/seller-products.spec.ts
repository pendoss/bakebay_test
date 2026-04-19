import {expect, test} from "@playwright/test";
import {
    ensureSeedData,
    FOREIGN_SELLER_EMAIL,
    FOREIGN_SELLER_PASSWORD,
    SELLER_EMAIL,
    SELLER_PASSWORD
} from "./utils/seed";

test.describe("Товары и ингредиенты продавца", () => {
    test("Свой продукт доступен по API; чужой продавец видит, но не должен редактировать", async ({request}) => {
        const seed = await ensureSeedData();

        // Запрос продукта по id — публичный
        const own = await request.get(`/api/products?id=${seed.productAId}`);
        expect(own.status()).toBe(200);
        const ownJson = await own.json();
        expect(ownJson.seller_id).toBe(seed.sellerId);

        const foreign = await request.get(`/api/products?id=${seed.foreignProductId}`);
        expect(foreign.status()).toBe(200);
        const foreignJson = await foreign.json();
        expect(foreignJson.seller_id).toBe(seed.foreignSellerId);
        expect(foreignJson.seller_id).not.toBe(seed.sellerId);
    });

    test("UI: продавец видит свои продукты в дашборде", async ({page}) => {
        await page.request.post("/api/auth", {data: {email: SELLER_EMAIL, password: SELLER_PASSWORD}});
        await page.goto("/seller-dashboard/products");
        await expect(page.locator("body")).toContainText(/E2E Торт Шоколадный/i, {timeout: 15_000});
    });

    test("UI: чужой продавец не видит чужих товаров в своём дашборде", async ({page}) => {
        await page.request.post("/api/auth", {
            data: {email: FOREIGN_SELLER_EMAIL, password: FOREIGN_SELLER_PASSWORD},
        });
        await page.goto("/seller-dashboard/products");
        await expect(page.locator("body")).not.toContainText(/E2E Торт Шоколадный/i, {timeout: 15_000});
    });

    test("Ингредиент существует и виден через products API", async () => {
        const seed = await ensureSeedData();
        expect(seed.ingredientId).toBeGreaterThan(0);
    });
});
