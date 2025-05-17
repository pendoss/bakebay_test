"use server"

import { db, product_ingredients, productImages } from "@/src/db";
import { eq } from "drizzle-orm";

interface Ingredient {
    name: string,
    amount: number,
    stock: number,
    unit: string,
    status: string,
    alert: number
}

export async function fetchIngredients(): Promise<{ingredients: Ingredient[], error: string | null}>{
    try{
        const dbIngredients = await db.selectDistinct().from(product_ingredients)

        
    }
};
