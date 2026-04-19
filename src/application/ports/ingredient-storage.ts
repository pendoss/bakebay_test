import type {Ingredient, StockStatus} from '@/src/domain/ingredient'
import type {IngredientId, ProductId, SellerId} from '@/src/domain/shared/id'

export interface IngredientUpdate {
    stock: number
    unit?: string
    alert?: number
    status: StockStatus
}

export interface IngredientStorage {
    listBySeller(sellerId: SellerId): Promise<Ingredient[]>

    listByProduct(productId: ProductId): Promise<Ingredient[]>

    findByNameAndProduct(name: string, productId: ProductId): Promise<Ingredient | null>

    updateById(id: IngredientId, patch: IngredientUpdate): Promise<void>

    updateByName(name: string, patch: IngredientUpdate): Promise<void>
}
