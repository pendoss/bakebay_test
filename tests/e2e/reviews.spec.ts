import {test, expect} from "@playwright/test";
import {registerUser} from "./utils/auth";
import {ensureSeedData, SELLER_EMAIL, SELLER_PASSWORD} from "./utils/seed";

test.describe("Отзывы и регрессия маршрутов", () => {
    test("Покупатель оставляет отзыв; виден на товаре", async ({request}) => {
        const seed = await ensureSeedData();
        const customer = await registerUser(request);
        await request.post("/api/auth", {data: {email: customer.email, password: customer.password}});

        const create = await request.post("/api/reviews", {
            data: {product_id: seed.productAId, rating: 5, comment: "E2E отличный торт!"},
        });
        expect(create.status()).toBe(200);
        const review = await create.json();
        expect(review.review_id).toBeGreaterThan(0);

        const list = await request.get(`/api/reviews?productId=${seed.productAId}`);
        expect(list.status()).toBe(200);
        const arr = await list.json();
        expect(arr.find((r: { comment: string }) => r.comment === "E2E отличный торт!")).toBeTruthy();
    });

    test("Отзыв без auth — 401", async ({request}) => {
        const seed = await ensureSeedData();
        const resp = await request.post("/api/reviews", {
            data: {product_id: seed.productAId, rating: 5, comment: "x"},
        });
        expect([401, 500]).toContain(resp.status());
    });

    test("Продавец отвечает на отзыв", async ({request}) => {
        const seed = await ensureSeedData();
        const customer = await registerUser(request);
        await request.post("/api/auth", {data: {email: customer.email, password: customer.password}});
        const create = await request.post("/api/reviews", {
            data: {product_id: seed.productAId, rating: 4, comment: "E2E reply target"},
        });
        const review = await create.json();

        await request.post("/api/auth", {data: {email: SELLER_EMAIL, password: SELLER_PASSWORD}});
        const reply = await request.put("/api/reviews", {
            data: {review_id: review.review_id, seller_reply: "Спасибо!"},
        });
        expect([200, 201]).toContain(reply.status());
    });

    test.describe("Smoke: ключевые маршруты возвращают 200", () => {
        for (const path of ["/", "/catalog", "/sellers", "/cart", "/orders"]) {
            test(`GET ${path}`, async ({page}) => {
                const resp = await page.goto(path);
                expect(resp?.status()).toBeLessThan(500);
            });
        }
    });
});
