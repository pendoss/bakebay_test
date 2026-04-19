import "dotenv/config";
import {eq} from "drizzle-orm";
import {db, orders, orderItems, products, productIngredients, users} from "@/src/adapters/storage/drizzle";

export async function getOrderById(orderId: number) {
    return db.query.orders.findFirst({where: eq(orders.order_id, orderId)});
}

export async function getOrderItems(orderId: number) {
    return db.select().from(orderItems).where(eq(orderItems.order_id, orderId));
}

export async function getProductStock(productId: number): Promise<number | null> {
    const row = await db.query.products.findFirst({where: eq(products.product_id, productId)});
    return row?.stock ?? null;
}

export async function getIngredientStock(ingredientId: number): Promise<number | null> {
    const row = await db.query.productIngredients.findFirst({
        where: eq(productIngredients.ingredient_id, ingredientId),
    });
    return row?.stock ?? null;
}

export async function getLatestOrderForUser(email: string) {
    const user = await db.query.users.findFirst({where: eq(users.email, email)});
    if (!user) return null;
    const list = await db.select().from(orders).where(eq(orders.user_id, user.user_id));
    return list.sort((a, b) => (b.order_id ?? 0) - (a.order_id ?? 0))[0] ?? null;
}
