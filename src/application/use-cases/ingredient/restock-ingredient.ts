import {applyRestock, IngredientNotFoundError} from '@/src/domain/ingredient'
import {asProductId} from '@/src/domain/shared/id'
import type {IngredientStorage} from '@/src/application/ports/ingredient-storage'

export interface RestockIngredientInput {
    name: string
    productId: number
    amount: number
    unit: string
    alert: number
}

export interface RestockIngredientDeps {
    ingredientStorage: IngredientStorage
}

export async function restockIngredient(input: RestockIngredientInput, deps: RestockIngredientDeps): Promise<void> {
    const current = await deps.ingredientStorage.findByNameAndProduct(input.name, asProductId(input.productId))
    if (!current) throw new IngredientNotFoundError(input.name)
    const next = applyRestock(current, input.amount, input.unit, input.alert)
    await deps.ingredientStorage.updateById(next.id, {
        stock: next.stock,
        unit: next.unit,
        alert: next.alert,
        status: next.status,
    })
}
