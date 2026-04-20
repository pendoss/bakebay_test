import {eq} from 'drizzle-orm'
import {db, sellers} from '@/src/adapters/storage/drizzle'
import type {SellerCommissionLookup} from '@/src/application/ports/seller-commission-lookup'
import type {SellerId} from '@/src/domain/shared/id'

export function sellerCommissionLookupDrizzle(defaultRate = 0.1): SellerCommissionLookup {
    return {
        async getRate(sellerId: SellerId): Promise<number> {
            const [row] = await db
                .select({rate: sellers.commission_rate})
                .from(sellers)
                .where(eq(sellers.seller_id, sellerId as unknown as number))
            return row?.rate ?? defaultRate
        },
    }
}
