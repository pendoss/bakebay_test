import {db, orderItems, productIngredients} from '@/src/db';
import {eq} from 'drizzle-orm';

export async function adjustIngredientStock(
    orderId: number,
    oldStatus: string,
    newStatus: string
) {
    if (newStatus === 'in_progress' && oldStatus !== 'in_progress') {
        const items = await db
            .select({productId: orderItems.product_id, quantity: orderItems.quantity})
            .from(orderItems)
            .where(eq(orderItems.order_id, orderId));

        for (const item of items) {
            if (!item.productId) continue;
            const ingredients = await db
                .select({
                    ingredient_id: productIngredients.ingredient_id,
                    name: productIngredients.name,
                    stock: productIngredients.stock,
                    amount: productIngredients.amount,
                    alert: productIngredients.alert,
                })
                .from(productIngredients)
                .where(eq(productIngredients.product_id, item.productId));

            for (const ing of ingredients) {
                const deduct = ing.amount * (item.quantity ?? 1);
                const newStock = (ing.stock ?? 0) - deduct;
                const status = newStock > (ing.alert ?? 0) ? 'ok' : 'low';
                await db
                    .update(productIngredients)
                    .set({stock: newStock, status})
                    .where(eq(productIngredients.name, ing.name));
            }
        }
    }

    if (oldStatus === 'in_progress' && newStatus === 'cancelled') {
        const items = await db
            .select({productId: orderItems.product_id, quantity: orderItems.quantity})
            .from(orderItems)
            .where(eq(orderItems.order_id, orderId));

        for (const item of items) {
            if (!item.productId) continue;
            const ingredients = await db
                .select({
                    name: productIngredients.name,
                    stock: productIngredients.stock,
                    amount: productIngredients.amount,
                    alert: productIngredients.alert,
                })
                .from(productIngredients)
                .where(eq(productIngredients.product_id, item.productId));

            for (const ing of ingredients) {
                const restore = ing.amount * (item.quantity ?? 1);
                const newStock = (ing.stock ?? 0) + restore;
                const status = newStock > (ing.alert ?? 0) ? 'ok' : 'low';
                await db
                    .update(productIngredients)
                    .set({stock: newStock, status})
                    .where(eq(productIngredients.name, ing.name));
            }
        }
    }
}
