import type {Ingredient} from '@/src/domain/ingredient'
import type {SellerId} from '@/src/domain/shared/id'
import type {IngredientStorage} from '@/src/application/ports/ingredient-storage'

export interface ListIngredientsBySellerDeps {
    ingredientStorage: IngredientStorage
}

export async function listIngredientsBySeller(sellerId: SellerId, deps: ListIngredientsBySellerDeps): Promise<Ingredient[]> {
    return deps.ingredientStorage.listBySeller(sellerId)
}
