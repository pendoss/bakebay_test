import type {Seller} from '@/src/domain/seller'
import type {UserId} from '@/src/domain/shared/id'
import type {SellerStorage} from '@/src/application/ports/seller-storage'

export interface FindSellerByUserDeps {
    sellerStorage: SellerStorage
}

export async function findSellerByUser(userId: UserId, deps: FindSellerByUserDeps): Promise<Seller | null> {
    return deps.sellerStorage.findByUserId(userId)
}
