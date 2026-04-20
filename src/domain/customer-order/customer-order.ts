import type {CustomerOrderId, SellerOrderId, UserId} from '@/src/domain/shared/id'
import type {SellerOrderStatus} from '@/src/domain/seller-order'

export type CustomerOrderDerivedStatus =
    | 'negotiating'
    | 'awaiting_payment'
    | 'partially_paid'
    | 'in_fulfillment'
    | 'partially_delivered'
    | 'delivered'
    | 'cancelled'
    | 'partially_cancelled'

export interface CustomerOrder {
    readonly id: CustomerOrderId
    readonly userId: UserId
    readonly derivedStatus: CustomerOrderDerivedStatus
    readonly address: string
    readonly createdAt: Date
    readonly sellerOrderIds: ReadonlyArray<SellerOrderId>
}

export class EmptyCustomerOrderError extends Error {
    constructor() {
        super('CustomerOrder has no seller sub-orders')
        this.name = 'EmptyCustomerOrderError'
    }
}

const NEGOTIATING_STATES: ReadonlySet<SellerOrderStatus> = new Set<SellerOrderStatus>([
    'draft',
    'pending_seller_review',
    'negotiating',
    'awaiting_customer_approval',
])

const FULFILLMENT_STATES: ReadonlySet<SellerOrderStatus> = new Set<SellerOrderStatus>([
    'paid',
    'preparing',
    'preparing_blocked',
    'ready_to_ship',
    'delivering',
])

export function computeDerivedStatus(subs: ReadonlyArray<SellerOrderStatus>): CustomerOrderDerivedStatus {
    if (subs.length === 0) throw new EmptyCustomerOrderError()

    const cancelledCount = subs.filter((s) => s === 'cancelled').length
    if (cancelledCount === subs.length) return 'cancelled'

    const active = subs.filter((s) => s !== 'cancelled')
    const hasCancelled = cancelledCount > 0

    if (active.some((s) => NEGOTIATING_STATES.has(s))) return 'negotiating'

    if (active.every((s) => s === 'confirmed')) return 'awaiting_payment'

    if (active.every((s) => s === 'confirmed' || s === 'paid') && active.some((s) => s === 'paid') && active.some((s) => s === 'confirmed')) {
        return 'partially_paid'
    }

    if (active.every((s) => s === 'delivered')) {
        return hasCancelled ? 'partially_cancelled' : 'delivered'
    }

    if (active.some((s) => s === 'delivered')) return 'partially_delivered'

    if (active.some((s) => FULFILLMENT_STATES.has(s))) return 'in_fulfillment'

    return 'in_fulfillment'
}
