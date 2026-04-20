import type {CustomerOrderStorage, SellerOrderStorage} from '@/src/application/ports/customer-order-storage'
import type {SellerOrderId} from '@/src/domain/shared/id'
import {canTransition, type SellerOrderStatus} from '@/src/domain/seller-order'
import {computeDerivedStatus} from '@/src/domain/customer-order'

export type ThreadEvent =
    | 'customer-message'
    | 'seller-message'
    | 'seller-offer'
    | 'customer-revision'
    | 'customer-accept'
    | 'seller-finalize'

const TARGET: Record<ThreadEvent, SellerOrderStatus> = {
    'customer-message': 'negotiating',
    'seller-message': 'negotiating',
    'seller-offer': 'awaiting_customer_approval',
    'customer-revision': 'negotiating',
    'customer-accept': 'awaiting_customer_approval',
    'seller-finalize': 'confirmed',
}

export async function syncSellerOrderFromThreadEvent(
    sellerOrderId: SellerOrderId,
    event: ThreadEvent,
    deps: { sellerOrderStorage: SellerOrderStorage; customerOrderStorage: CustomerOrderStorage },
): Promise<void> {
    const order = await deps.sellerOrderStorage.findById(sellerOrderId)
    if (!order) return

    const target = TARGET[event]
    if (order.status === target) return
    if (!canTransition(order.status, target)) return

    await deps.sellerOrderStorage.updateStatus(sellerOrderId, target)

    const siblings = await deps.sellerOrderStorage.listByCustomerOrder(order.customerOrderId)
    if (siblings.length === 0) return
    const derived = computeDerivedStatus(
        siblings.map((s) => (s.id === sellerOrderId ? target : s.status)),
    )
    await deps.customerOrderStorage.updateDerivedStatus(order.customerOrderId, derived)
}
