"use server"

import {db} from "@/src/db";
import {sql} from "drizzle-orm";

interface Ingredient {
    ingredient_id: number,
    name: string,
    amount: string,
    stock: number,
    unit: string,
    status: string,
    alert: number,
    purchase_qty: number,
    purchase_price: number,
}

export async function fetchIngredients(sellerId?: number | null): Promise<{
    ingredients: Ingredient[],
    error: string | null
}> {
    try{
        const targetSellerId = sellerId ?? 0;
        const statement = sql`
            WITH first_per_ingredient AS (
                SELECT MIN(pi.ingredient_id) AS ingredient_id
                FROM product_ingredients pi
                JOIN products p ON pi.product_id = p.product_id
                WHERE p.seller_id = ${targetSellerId}
                GROUP BY pi.name
            )
            SELECT pi.ingredient_id, pi.name, pi.stock, pi.unit, pi.alert, pi.status,
                   pi.purchase_qty, pi.purchase_price
            FROM product_ingredients pi
            JOIN first_per_ingredient fpi ON pi.ingredient_id = fpi.ingredient_id
            ORDER BY pi.name
        `;

        const res = await db.execute(statement);

        const ingredients: Ingredient[] = res.rows.map(row => ({
            ingredient_id: Number(row.ingredient_id),
            name: row.name as string,
            amount: row.amount as string,
            stock: Number(row.stock),
            unit: row.unit as string,
            status: row.status as string,
            alert: Number(row.alert),
            purchase_qty: Number(row.purchase_qty ?? 1),
            purchase_price: Number(row.purchase_price ?? 0),
        }));

        return { ingredients, error: null };
    } catch (error) {
        console.log("Error getting ingredients: ", error)
        return {ingredients: [], error: "Error getting ingredients"};
    }
}
