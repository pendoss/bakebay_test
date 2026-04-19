import {test, expect} from "@playwright/test";
import {registerUser} from "./utils/auth";
import {ensureSeedData} from "./utils/seed";
import {getOrderItems, getOrderById} from "./utils/db";

test.describe("Оформление заказа покупателем", () => {
    test("API: создание заказа авторизованным пользователем", async ({request}) => {
        const seed = await ensureSeedData();
        const user = await registerUser(request);
        await request.post("/api/auth", {data: {email: user.email, password: user.password}});

        const resp = await request.post("/api/orders", {
            data: {
                address: "ул. Тестовая, 1",
                payment_method: "Credit Card",
                items: [
                    {product_id: seed.productAId, quantity: 2},
                    {product_id: seed.productBId, quantity: 1},
                ],
            },
        });
        expect(resp.status()).toBe(200);
        const order = await resp.json();
        expect(order.order_id).toBeGreaterThan(0);

        const dbOrder = await getOrderById(order.order_id);
        expect(dbOrder?.order_status).toBe("ordering");
        expect(dbOrder?.address).toBe("ул. Тестовая, 1");

        const items = await getOrderItems(order.order_id);
        expect(items).toHaveLength(2);
        const totalQty = items.reduce((s, i) => s + i.quantity, 0);
        expect(totalQty).toBe(3);
    });

    test("API: заказ без авторизации — 401", async ({request}) => {
        const seed = await ensureSeedData();
        const resp = await request.post("/api/orders", {
            data: {
                address: "x",
                payment_method: "y",
                items: [{product_id: seed.productAId, quantity: 1}],
            },
        });
        expect(resp.status()).toBe(401);
    });

    test("API: пустой items — 400", async ({request}) => {
        const user = await registerUser(request);
        await request.post("/api/auth", {data: {email: user.email, password: user.password}});
        const resp = await request.post("/api/orders", {
            data: {address: "x", payment_method: "y", items: []},
        });
        expect(resp.status()).toBe(400);
    });

    test("API: несуществующий товар — 404", async ({request}) => {
        const user = await registerUser(request);
        await request.post("/api/auth", {data: {email: user.email, password: user.password}});
        const resp = await request.post("/api/orders", {
            data: {
                address: "x",
                payment_method: "y",
                items: [{product_id: 999_999_999, quantity: 1}],
            },
        });
        expect(resp.status()).toBe(404);
    });

    test("UI: заказ виден на /orders после оформления", async ({page}) => {
        const seed = await ensureSeedData();
        const user = await registerUser(page.request);
        await page.request.post("/api/auth", {data: {email: user.email, password: user.password}});

        const resp = await page.request.post("/api/orders", {
            data: {
                address: "ул. Тестовая, 1",
                payment_method: "Credit Card",
                items: [{product_id: seed.productAId, quantity: 1}],
            },
        });
        const order = await resp.json();

        await page.goto("/orders");
        await expect(page.getByText(new RegExp(`#?${order.order_id}`)).first()).toBeVisible({timeout: 15_000});
    });
});
