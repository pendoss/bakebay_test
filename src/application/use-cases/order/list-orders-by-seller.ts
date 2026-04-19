import type {Order} from '@/src/domain/order'
import type {SellerId} from '@/src/domain/shared/id'
import type {OrderStorage} from '@/src/application/ports/order-storage'

export interface ListOrdersBySellerDeps {
    orderStorage: OrderStorage
}

export async function listOrdersBySeller(sellerId: SellerId, deps: ListOrdersBySellerDeps): Promise<Order[]> {
    const ids = await deps.orderStorage.listIds({sellerId})
    if (ids.length === 0) return []
    return deps.orderStorage.listByIds(ids)
}
