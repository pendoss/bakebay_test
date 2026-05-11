import type {Ingredient, StockStatus} from '@/src/domain/ingredient'
import type {RequiredIngredient} from '@/src/domain/seller-order'
import type {IngredientId, ProductId, SellerId, SellerOrderId} from '@/src/domain/shared/id'

export interface IngredientUpdate {
    stock: number
    unit?: string
    alert?: number
    status: StockStatus
}

export interface RawStockEntry {
    readonly stock: number
    readonly alertThreshold: number
}

export interface IngredientStorage {
    listBySeller(sellerId: SellerId): Promise<Ingredient[]>

    listByProduct(productId: ProductId): Promise<Ingredient[]>

    findByNameAndProduct(name: string, productId: ProductId): Promise<Ingredient | null>

    updateById(id: IngredientId, patch: IngredientUpdate): Promise<void>

    updateByName(name: string, patch: IngredientUpdate): Promise<void>

    getStockByKeys(
        sellerId: SellerId,
        keys: ReadonlyArray<string>,
    ): Promise<Record<string, RawStockEntry>>

    getRequiredForSellerOrder(sellerOrderId: SellerOrderId): Promise<RequiredIngredient[]>

    decrementStockByKey(sellerId: SellerId, key: string, amount: number): Promise<void>
}
