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

export async function fetchIngredients(): Promise<{ingredients: Ingredient[], error: string | null}>{
    try{
        const statement = sql`
            with all_ingredients_for_seller as (
    select s.seller_id, name, pi.stock, unit, alert, pi.status from product_ingredients pi
                                                                        join products p on pi.product_id=p.product_id
                                                                        join sellers s on p.seller_id=s.seller_id
    where s.seller_id = 1),
     sum_products_per_seller as (
         select name, sum(stock) from all_ingredients_for_seller
         group by name)

select distinct seller_id, ai.name, stock, unit, alert, status
from all_ingredients_for_seller ai
         inner join sum_products_per_seller sp on ai.name=sp.name
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
