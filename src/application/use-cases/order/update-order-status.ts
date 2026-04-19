import {assertTransition, OrderNotFoundError} from '@/src/domain/order'
import type {OrderStatus} from '@/src/domain/order'
import type {OrderId} from '@/src/domain/shared/id'
import type {OrderStorage} from '@/src/application/ports/order-storage'

export interface UpdateOrderStatusInput {
    id: OrderId
    next: OrderStatus
}

export interface UpdateOrderStatusDeps {
    orderStorage: OrderStorage
}

export async function updateOrderStatus(input: UpdateOrderStatusInput, deps: UpdateOrderStatusDeps): Promise<void> {
    const order = await deps.orderStorage.findById(input.id)
    if (!order) throw new OrderNotFoundError(input.id)
    assertTransition(order.status, input.next)
    await deps.orderStorage.updateStatus(input.id, input.next)
}
