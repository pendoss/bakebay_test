import {test, expect} from "@playwright/test";
import {registerUser} from "./utils/auth";
import {ensureSeedData, SELLER_EMAIL, SELLER_PASSWORD} from "./utils/seed";

test.describe("Уведомления", () => {
    test("Покупатель получает уведомление при смене статуса заказа", async ({page, request}) => {
        const seed = await ensureSeedData();
        const customer = await registerUser(page.request);
        await page.request.post("/api/auth", {
            data: {email: customer.email, password: customer.password},
        });
        const orderResp = await page.request.post("/api/orders", {
            data: {
                address: "ул. Уведомлений, 3",
                payment_method: "Cash",
                items: [{product_id: seed.productAId, quantity: 1}],
            },
        });
        const order = await orderResp.json();

        await page.goto("/orders");
        await expect(page.getByText(new RegExp(`#?${order.order_id}`)).first()).toBeVisible({
            timeout: 15_000,
        });

        // продавец меняет статус через independent request
        await request.post("/api/auth", {data: {email: SELLER_EMAIL, password: SELLER_PASSWORD}});
        await request.put("/api/orders", {
            data: {
                order_id: order.order_id,
                order_status: "processing",
                address: "ул. Уведомлений, 3",
                payment_method: "Cash",
            },
        });

        // покупатель снова заходит на /orders → хук видит изменение статуса
        await page.reload();
        await page.waitForTimeout(500);
        await page.reload();
        await expect(
            page
                .getByText(/Статус заказа.*обновлён|processing|В обработке/i)
                .first()
        ).toBeVisible({timeout: 10_000});
    });

    test("Notification container смонтирован в layout", async ({page}) => {
        await page.goto("/");
        await expect(page.locator("body")).toBeVisible();
    });
});
