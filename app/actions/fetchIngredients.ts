'use server'

import {ingredientStorageDrizzle} from '@/src/adapters/storage/drizzle/ingredient-storage-drizzle'
import {ingredientReservationStorageDrizzle} from '@/src/adapters/storage/drizzle/ingredient-reservation-storage-drizzle'
import {listIngredientsBySeller} from '@/src/application/use-cases/ingredient'
import {asSellerId} from '@/src/domain/shared/id'

interface Ingredient {
    ingredient_id: number
    name: string
    amount: string
    stock: number
    unit: string
    status: string
    alert: number
    purchase_qty: number
    purchase_price: number
    reserved: number
}

export async function fetchIngredients(sellerId?: number | null): Promise<{
    ingredients: Ingredient[]
    error: string | null
}> {
    try {
        const branded = asSellerId(sellerId ?? 0)
        const list = await listIngredientsBySeller(branded, {
            ingredientStorage: ingredientStorageDrizzle(),
        })
        const reservedByName = await ingredientReservationStorageDrizzle().sumReservedByKeys(
            branded,
            list.map((ing) => ing.name),
        )
        const ingredients = list.map<Ingredient>((ing) => ({
            ingredient_id: ing.id as unknown as number,
            name: ing.name,
            amount: String(ing.amount),
            stock: ing.stock,
            unit: ing.unit,
            status: ing.status,
            alert: ing.alert,
            purchase_qty: ing.purchaseQty,
            purchase_price: ing.purchasePrice,
            reserved: reservedByName[ing.name] ?? 0,
        }))
        return {ingredients, error: null}
    } catch (error) {
        console.error('Error getting ingredients:', error)
        return {ingredients: [], error: 'Error getting ingredients'}
    }
}
