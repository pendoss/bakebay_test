"use server"

import { db, productIngredients, productImages } from "@/src/db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { products, sellers } from "@/src/db";

interface Ingredient {
    name: string,
    amount: string,
    stock: number,
    unit: string,
    status: string,
    alert: number
}

export async function fetchIngredients(sellerId?: number | null): Promise<{
    ingredients: Ingredient[],
    error: string | null
}> {
    try{
        const targetSellerId = sellerId ?? 0;
        const statement = sql`
            with all_ingredients_for_seller as (
    select s.seller_id, pi.name, pi.stock, pi.unit, pi.alert, pi.status from product_ingredients pi
                                                                        join products p on pi.product_id=p.product_id
                                                                        join sellers s on p.seller_id=s.seller_id
    where s.seller_id = ${targetSellerId}),
     sum_per_ingredient as (
         select name, sum(stock) as total_stock from all_ingredients_for_seller
         group by name)

select distinct ai.seller_id, ai.name, sp.total_stock as stock, ai.unit, ai.alert, ai.status
from all_ingredients_for_seller ai
         inner join sum_per_ingredient sp on ai.name=sp.name
        `;
        
        // const ingredients: Ingredient[] = result.map(row => ({
        //     name: row.name,
        //     amount: Number(row.amount),
        //     stock: Number(row.stock),
        //     unit: row.unit,
        //     status: row.status,
        //     alert: Number(row.alert)
        // }));d
        
        const res = await db.execute(statement);
        
        const ingredients: Ingredient[] = res.rows.map(row => ({
            name: row.name as string,
            amount: row.amount as string,
            stock: Number(row.stock),
            unit: row.unit as string,
            status: row.status as string,
            alert: Number(row.alert)
        }));
    
        
        // console.log("result from query:", ingredients);
        return { ingredients, error: null };
        // const res: postgres.RowList<Record<string, unknown>[]> = await db.execute(statement);        
    } catch (error) {
        console.log("Error getting ingredients: ", error)
        return {ingredients: [], error: " Error geting ingredients"};
    }
};
