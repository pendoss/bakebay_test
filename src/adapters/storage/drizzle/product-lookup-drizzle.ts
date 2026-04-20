import {inArray} from 'drizzle-orm'
import {db, products} from '@/src/adapters/storage/drizzle'
import type {ProductLookup, ProductLookupRecord} from '@/src/application/ports/product-lookup'
import {asProductId, asSellerId} from '@/src/domain/shared/id'
import type {ProductId} from '@/src/domain/shared/id'

export function productLookupDrizzle(): ProductLookup {
    return {
        async getMany(ids: ReadonlyArray<ProductId>): Promise<ReadonlyArray<ProductLookupRecord>> {
            if (ids.length === 0) return []
            const numeric = ids.map((i) => i as unknown as number)
            const rows = await db
                .select({
                    productId: products.product_id,
                    sellerId: products.seller_id,
                    price: products.price,
                    isCustomizable: products.is_customizable,
                })
                .from(products)
                .where(inArray(products.product_id, numeric))
            return rows
                .filter((r) => r.sellerId !== null)
                .map((r) => ({
                    productId: asProductId(r.productId),
                    sellerId: asSellerId(r.sellerId as number),
                    price: r.price,
                    isCustomizable: r.isCustomizable,
                }))
        },
    }
}
