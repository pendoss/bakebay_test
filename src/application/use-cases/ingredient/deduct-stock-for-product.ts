import {applyDeduction} from '@/src/domain/ingredient'
import {asProductId} from '@/src/domain/shared/id'
import type {IngredientStorage} from '@/src/application/ports/ingredient-storage'

export interface DeductStockForProductInput {
    productId: number
    quantity?: number
}

export interface DeductStockForProductDeps {
    ingredientStorage: IngredientStorage
}

export async function deductStockForProduct(input: DeductStockForProductInput, deps: DeductStockForProductDeps): Promise<void> {
    const ingredients = await deps.ingredientStorage.listByProduct(asProductId(input.productId))
    const multiplier = input.quantity ?? 1
    await Promise.all(ingredients.map(async (ing) => {
        const next = applyDeduction(ing, ing.amount * multiplier)
        await deps.ingredientStorage.updateByName(ing.name, {
            stock: next.stock,
            status: next.status,
        })
    }))
}
