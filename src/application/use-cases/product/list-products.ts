import type {Product} from '@/src/domain/product'
import type {SellerId} from '@/src/domain/shared/id'
import type {ProductStorage, ProductListFilters} from '@/src/application/ports/product-storage'

export async function listProducts(
    filters: ProductListFilters,
    deps: { productStorage: ProductStorage },
): Promise<Product[]> {
    return deps.productStorage.list(filters)
}

export async function listProductsBySeller(
    sellerId: SellerId,
    deps: { productStorage: ProductStorage },
): Promise<Product[]> {
    return deps.productStorage.listBySeller(sellerId)
}

export async function countProductsBySeller(
    sellerId: SellerId,
    deps: { productStorage: ProductStorage },
): Promise<number> {
    return deps.productStorage.countBySeller(sellerId)
}
