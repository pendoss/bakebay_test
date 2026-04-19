import type {Product} from '@/src/domain/product'
import {ProductNotFoundError} from '@/src/domain/product'
import type {ProductId} from '@/src/domain/shared/id'
import type {ProductStorage} from '@/src/application/ports/product-storage'

export async function getProduct(id: ProductId, deps: { productStorage: ProductStorage }): Promise<Product> {
    const product = await deps.productStorage.findById(id)
    if (!product) throw new ProductNotFoundError(id)
    return product
}
