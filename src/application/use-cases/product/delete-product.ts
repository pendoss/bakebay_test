import {ProductNotFoundError} from '@/src/domain/product'
import type {ProductId} from '@/src/domain/shared/id'
import type {ProductStorage} from '@/src/application/ports/product-storage'

export async function deleteProduct(id: ProductId, deps: { productStorage: ProductStorage }): Promise<void> {
    const ok = await deps.productStorage.delete(id)
    if (!ok) throw new ProductNotFoundError(id)
}
