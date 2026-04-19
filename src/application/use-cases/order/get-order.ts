import type {Order} from '@/src/domain/order'
import {OrderNotFoundError} from '@/src/domain/order'
import type {OrderId} from '@/src/domain/shared/id'
import type {OrderStorage} from '@/src/application/ports/order-storage'

export interface GetOrderDeps {
    orderStorage: OrderStorage
}

export async function getOrder(id: OrderId, deps: GetOrderDeps): Promise<Order> {
    const order = await deps.orderStorage.findById(id)
    if (!order) throw new OrderNotFoundError(id)
    return order
}
