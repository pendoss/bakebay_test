import {test, expect} from "@playwright/test";
import {registerUser} from "./utils/auth";
import {ensureSeedData, SELLER_EMAIL, SELLER_PASSWORD} from "./utils/seed";
import {getIngredientStock, getOrderById, getProductStock} from "./utils/db";

test.describe("Поток продавца + смена статусов", () => {
    test("продавец видит новый заказ и проводит его по статусам", async ({request}) => {
        const seed = await ensureSeedData();

        // 1) покупатель создаёт заказ
        const customer = await registerUser(request);
        await request.post("/api/auth", {data: {email: customer.email, password: customer.password}});
        const orderResp = await request.post("/api/orders", {
            data: {
                address: "ул. Продавцов, 2",
                payment_method: "Cash",
                items: [{product_id: seed.productAId, quantity: 2}],
            },
        });
        const order = await orderResp.json();

        const stockBefore = await getProductStock(seed.productAId);
        const ingredientBefore = await getIngredientStock(seed.ingredientId);
        expect(stockBefore).not.toBeNull();
        expect(ingredientBefore).not.toBeNull();

        // 2) продавец логинится и видит заказ
        await request.post("/api/auth", {data: {email: SELLER_EMAIL, password: SELLER_PASSWORD}});
        const ordersList = await request.get(`/api/orders`);
        expect(ordersList.status()).toBe(200);
        const arr = await ordersList.json();
        expect(arr.find((o: { id: string }) => o.id === String(order.order_id))).toBeTruthy();

        // 3) переходы по статусам
        const statuses = ["processing", "in_progress", "delivering", "delivered"];
        for (const status of statuses) {
            const resp = await request.put("/api/orders", {
                data: {
                    order_id: order.order_id,
                    order_status: status,
                    address: "ул. Продавцов, 2",
                    payment_method: "Cash",
                },
            });
            expect(resp.status(), `transition to ${status}`).toBe(200);
            const updated = await getOrderById(order.order_id);
            expect(updated?.order_status).toBe(status);
        }

        // 4) после delivering ingredient stock уменьшен (updateStockById декрементит ингредиенты)
        const ingredientAfter = await getIngredientStock(seed.ingredientId);
        expect(ingredientAfter).not.toBeNull();
        expect(ingredientAfter!).toBeLessThan(ingredientBefore!);

        // products.stock в текущей реализации не меняется при delivering — проверяем что хотя бы не выросло
        const stockAfter = await getProductStock(seed.productAId);
        expect(stockAfter).not.toBeNull();
        expect(stockAfter!).toBeLessThanOrEqual(stockBefore!);
    });
});
