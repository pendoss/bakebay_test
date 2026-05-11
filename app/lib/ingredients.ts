import {db, orderItems, productIngredients} from '@/src/adapters/storage/drizzle';
import {eq} from 'drizzle-orm';

async function applyIngredientDelta(orderId: number, sign: 1 | -1) {
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
            const delta = ing.amount * (item.quantity ?? 1) * sign;
            const newStock = (ing.stock ?? 0) + delta;
            const status = newStock > (ing.alert ?? 0) ? 'ok' : 'low';
            await db
                .update(productIngredients)
                .set({stock: newStock, status})
                .where(eq(productIngredients.name, ing.name));
        }
    }
}

export async function adjustIngredientStock(
    orderId: number,
    oldStatus: string,
    newStatus: string
) {
    if (newStatus === 'in_progress' && oldStatus !== 'in_progress') {
        await applyIngredientDelta(orderId, -1);
    }

    if (oldStatus === 'in_progress' && newStatus === 'cancelled') {
        await applyIngredientDelta(orderId, 1);
    }
}
