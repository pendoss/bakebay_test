import type {Seller} from '@/src/domain/seller'
import type {SellerId, UserId} from '@/src/domain/shared/id'

export interface SellerStorage {
    findById(id: SellerId): Promise<Seller | null>

    findByUserId(userId: UserId): Promise<Seller | null>

    list(): Promise<Seller[]>
}
