import type {SellerId} from '@/src/domain/shared/id'

export interface SellerCommissionLookup {
    getRate(sellerId: SellerId): Promise<number>
}
