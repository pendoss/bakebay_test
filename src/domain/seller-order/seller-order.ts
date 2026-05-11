import type {
    CustomerOrderId,
    ProductId,
    SellerId,
    SellerOrderId,
    SellerOrderItemId,
    CustomizationThreadId,
} from '@/src/domain/shared/id'

export type SellerOrderStatus =
    | 'draft'
    | 'pending_seller_review'
    | 'negotiating'
    | 'awaiting_customer_approval'
    | 'confirmed'
    | 'paid'
    | 'preparing_blocked'
    | 'preparing'
    | 'ready_to_ship'
    | 'delivering'
    | 'delivered'
    | 'cancelled'

export type CancelActor = 'customer' | 'seller' | 'system'

export interface SellerOrderItem {
    readonly id: SellerOrderItemId
    readonly productId: ProductId
    readonly quantity: number
    readonly customizationThreadId: CustomizationThreadId | null
    readonly unitPrice: number
    readonly customizationDelta: number
}

export interface SellerOrderPricing {
    readonly subtotal: number
    readonly customizationDelta: number
    readonly shipping: number
    readonly commissionRate: number
    readonly commissionAmount: number
    readonly total: number
}

export type RefundState = 'none' | 'requested' | 'approved' | 'rejected'

export interface SellerOrder {
    readonly id: SellerOrderId
    readonly customerOrderId: CustomerOrderId
    readonly sellerId: SellerId
    readonly status: SellerOrderStatus
    readonly items: ReadonlyArray<SellerOrderItem>
    readonly pricing: SellerOrderPricing
    readonly stockCheck: StockOverall
    readonly refundState: RefundState
    readonly refundReason: string | null
    readonly cancelReason: string | null
}

export type StockOverall = 'ok' | 'low' | 'missing' | 'unknown'

const REFUND_ELIGIBLE_STATUSES: ReadonlySet<SellerOrderStatus> = new Set<SellerOrderStatus>([
    'paid',
    'preparing_blocked',
    'preparing',
    'ready_to_ship',
])

export class RefundNotAllowedError extends Error {
    constructor(public readonly status: SellerOrderStatus, public readonly refundState: RefundState) {
        super(`Refund cannot be requested: status=${status}, refundState=${refundState}`)
        this.name = 'RefundNotAllowedError'
    }
}

export function canRequestRefund(order: SellerOrder): boolean {
    if (order.refundState !== 'none' && order.refundState !== 'rejected') return false
    return REFUND_ELIGIBLE_STATUSES.has(order.status)
}

export function assertRefundRequestable(order: SellerOrder): void {
    if (!canRequestRefund(order)) throw new RefundNotAllowedError(order.status, order.refundState)
}

export function withRefundRequested(order: SellerOrder, reason: string): SellerOrder {
    assertRefundRequestable(order)
    return {...order, refundState: 'requested', refundReason: reason}
}

const ALLOWED_TRANSITIONS: Record<SellerOrderStatus, ReadonlyArray<SellerOrderStatus>> = {
    draft: ['pending_seller_review', 'cancelled'],
    pending_seller_review: ['negotiating', 'awaiting_customer_approval', 'confirmed', 'cancelled'],
    negotiating: ['awaiting_customer_approval', 'cancelled'],
    awaiting_customer_approval: ['negotiating', 'confirmed', 'cancelled'],
    confirmed: ['paid', 'cancelled'],
    paid: ['preparing', 'preparing_blocked', 'cancelled'],
    preparing_blocked: ['preparing', 'cancelled'],
    preparing: ['ready_to_ship', 'cancelled'],
    ready_to_ship: ['delivering', 'cancelled'],
    delivering: ['delivered'],
    delivered: [],
    cancelled: [],
}

const CUSTOMER_CANCELLABLE: ReadonlySet<SellerOrderStatus> = new Set<SellerOrderStatus>([
    'draft',
    'pending_seller_review',
    'negotiating',
    'awaiting_customer_approval',
    'confirmed',
])

const SELLER_CANCELLABLE: ReadonlySet<SellerOrderStatus> = new Set<SellerOrderStatus>([
    'draft',
    'pending_seller_review',
    'negotiating',
    'awaiting_customer_approval',
    'confirmed',
    'paid',
    'preparing_blocked',
    'preparing',
    'ready_to_ship',
])

const SYSTEM_CANCELLABLE: ReadonlySet<SellerOrderStatus> = new Set<SellerOrderStatus>([
    'pending_seller_review',
    'negotiating',
    'awaiting_customer_approval',
    'confirmed',
])

export class InvalidSellerOrderTransitionError extends Error {
    constructor(from: SellerOrderStatus, to: SellerOrderStatus) {
        super(`Invalid seller order transition: ${from} → ${to}`)
        this.name = 'InvalidSellerOrderTransitionError'
    }
}

export class CancellationNotAllowedError extends Error {
    constructor(from: SellerOrderStatus, actor: CancelActor) {
        super(`Actor ${actor} cannot cancel seller order in status ${from}`)
        this.name = 'CancellationNotAllowedError'
    }
}

export class SellerOrderNotFoundError extends Error {
    constructor(id: SellerOrderId) {
        super(`Seller order ${id} not found`)
        this.name = 'SellerOrderNotFoundError'
    }
}

export function canTransition(from: SellerOrderStatus, to: SellerOrderStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to)
}

export function assertTransition(from: SellerOrderStatus, to: SellerOrderStatus): void {
    if (!canTransition(from, to)) throw new InvalidSellerOrderTransitionError(from, to)
}

export function canCancel(from: SellerOrderStatus, actor: CancelActor): boolean {
    const set =
        actor === 'customer' ? CUSTOMER_CANCELLABLE : actor === 'seller' ? SELLER_CANCELLABLE : SYSTEM_CANCELLABLE
    return set.has(from)
}

export function assertCancellable(from: SellerOrderStatus, actor: CancelActor): void {
    if (!canCancel(from, actor)) throw new CancellationNotAllowedError(from, actor)
}

export function isTerminal(status: SellerOrderStatus): boolean {
    return status === 'delivered' || status === 'cancelled'
}

export function calcPricing(params: {
    subtotal: number
    customizationDelta: number
    shipping: number
    commissionRate: number
}): SellerOrderPricing {
    const {subtotal, customizationDelta, shipping, commissionRate} = params
    const gross = subtotal + customizationDelta + shipping
    const commissionAmount = Math.round((subtotal + customizationDelta) * commissionRate)
    return {
        subtotal,
        customizationDelta,
        shipping,
        commissionRate,
        commissionAmount,
        total: gross,
    }
}

export function calcItemsSubtotal(items: ReadonlyArray<SellerOrderItem>): number {
    return items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0)
}

export function calcItemsCustomizationDelta(items: ReadonlyArray<SellerOrderItem>): number {
    return items.reduce((sum, it) => sum + it.customizationDelta * it.quantity, 0)
}

export function withStatus(order: SellerOrder, next: SellerOrderStatus): SellerOrder {
    assertTransition(order.status, next)
    return {...order, status: next}
}

export function withCancellation(
    order: SellerOrder,
    actor: CancelActor,
    reason: string,
): SellerOrder {
    assertCancellable(order.status, actor)
    return {...order, status: 'cancelled', cancelReason: reason}
}
