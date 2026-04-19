'use server'

import {ingredientStorageDrizzle} from '@/src/adapters/storage/drizzle/ingredient-storage-drizzle'
import {restockIngredient, deductStockForProduct} from '@/src/application/use-cases/ingredient'
import {IngredientNotFoundError} from '@/src/domain/ingredient'

export async function addIngredient(
    name: string,
    amount: number,
    unit: string,
    alert: number,
    product_id: number,
): Promise<{ error: string | null }> {
    try {
        await restockIngredient(
            {name, productId: product_id, amount, unit, alert},
            {ingredientStorage: ingredientStorageDrizzle()},
        )
        return {error: ''}
    } catch (error) {
        if (error instanceof IngredientNotFoundError) {
            return {error: error.message}
        }
        console.error('Error adding ingredient', error)
        return {error: "Can't add ingredient"}
    }
}

export async function updateStockById(productId: number): Promise<{ sucsess: boolean; error: string | null }> {
    try {
        await deductStockForProduct({productId}, {ingredientStorage: ingredientStorageDrizzle()})
        return {sucsess: true, error: ''}
    } catch (error) {
        console.error('error updating stock by id', error)
        return {sucsess: false, error: "Can't update stock by ID"}
    }
}
