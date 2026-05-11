import type {ProductId, SellerId} from '@/src/domain/shared/id'

export interface ProductLookupRecord {
    readonly productId: ProductId
    readonly sellerId: SellerId
    readonly price: number
    readonly isCustomizable: boolean
}

export interface ProductLookup {
    getMany(ids: ReadonlyArray<ProductId>): Promise<ReadonlyArray<ProductLookupRecord>>
}
