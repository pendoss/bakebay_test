import {
    assertTransition,
    calcItemsCustomizationDelta,
    calcItemsSubtotal,
    calcPricing,
    canCancel,
    canTransition,
    CancellationNotAllowedError,
    InvalidSellerOrderTransitionError,
    isTerminal,
    withCancellation,
    withStatus,
} from '../seller-order'
import type {SellerOrder, SellerOrderItem, SellerOrderStatus} from '../seller-order'
import {
    asCustomerOrderId,
    asProductId,
    asSellerId,
    asSellerOrderId,
    asSellerOrderItemId,
} from '@/src/domain/shared/id'

const item = (over: Partial<SellerOrderItem> = {}): SellerOrderItem => ({
    id: asSellerOrderItemId(1),
    productId: asProductId(10),
    quantity: 2,
    customizationThreadId: null,
    unitPrice: 500,
    customizationDelta: 0,
    ...over,
})

const order = (over: Partial<SellerOrder> = {}): SellerOrder => ({
    id: asSellerOrderId(100),
    customerOrderId: asCustomerOrderId(1),
    sellerId: asSellerId(7),
    status: 'pending_seller_review',
    items: [item()],
    pricing: calcPricing({subtotal: 1000, customizationDelta: 0, shipping: 0, commissionRate: 0.1}),
    stockCheck: 'unknown',
    cancelReason: null,
    ...over,
})

describe('seller-order FSM', () => {
    it('allows happy-path non-custom flow', () => {
        const path: SellerOrderStatus[] = [
            'draft',
            'pending_seller_review',
            'confirmed',
            'paid',
            'preparing',
            'ready_to_ship',
            'delivering',
            'delivered',
        ]
        for (let i = 0; i < path.length - 1; i++) {
            expect(canTransition(path[i], path[i + 1])).toBe(true)
        }
    })

    it('allows happy-path custom flow with negotiation loop', () => {
        expect(canTransition('pending_seller_review', 'negotiating')).toBe(true)
        expect(canTransition('negotiating', 'awaiting_customer_approval')).toBe(true)
        expect(canTransition('awaiting_customer_approval', 'negotiating')).toBe(true)
        expect(canTransition('awaiting_customer_approval', 'confirmed')).toBe(true)
    })

    it('allows preparing_blocked branch', () => {
        expect(canTransition('paid', 'preparing_blocked')).toBe(true)
        expect(canTransition('preparing_blocked', 'preparing')).toBe(true)
    })

    it('forbids skipping states', () => {
        expect(canTransition('pending_seller_review', 'paid')).toBe(false)
        expect(canTransition('confirmed', 'preparing')).toBe(false)
        expect(canTransition('paid', 'delivering')).toBe(false)
    })

    it('forbids moving out of terminal states', () => {
        expect(canTransition('delivered', 'paid')).toBe(false)
        expect(canTransition('cancelled', 'draft')).toBe(false)
        expect(isTerminal('delivered')).toBe(true)
        expect(isTerminal('cancelled')).toBe(true)
        expect(isTerminal('paid')).toBe(false)
    })

    it('assertTransition throws for invalid transition', () => {
        expect(() => assertTransition('draft', 'delivered')).toThrow(InvalidSellerOrderTransitionError)
    })

    it('withStatus returns a new object with the new status', () => {
        const o = order({status: 'confirmed'})
        const next = withStatus(o, 'paid')
        expect(next.status).toBe('paid')
        expect(o.status).toBe('confirmed')
    })
})

describe('seller-order cancellation rules', () => {
    it('customer can cancel up to confirmed, not after', () => {
        expect(canCancel('confirmed', 'customer')).toBe(true)
        expect(canCancel('paid', 'customer')).toBe(false)
        expect(canCancel('preparing', 'customer')).toBe(false)
        expect(canCancel('delivered', 'customer')).toBe(false)
    })

    it('seller can cancel up to ready_to_ship, not during delivery', () => {
        expect(canCancel('preparing', 'seller')).toBe(true)
        expect(canCancel('ready_to_ship', 'seller')).toBe(true)
        expect(canCancel('delivering', 'seller')).toBe(false)
        expect(canCancel('delivered', 'seller')).toBe(false)
    })

    it('system can cancel only pre-payment states (timeouts)', () => {
        expect(canCancel('pending_seller_review', 'system')).toBe(true)
        expect(canCancel('awaiting_customer_approval', 'system')).toBe(true)
        expect(canCancel('confirmed', 'system')).toBe(true)
        expect(canCancel('paid', 'system')).toBe(false)
    })

    it('withCancellation sets status and reason', () => {
        const o = order({status: 'confirmed'})
        const cancelled = withCancellation(o, 'customer', 'changed mind')
        expect(cancelled.status).toBe('cancelled')
        expect(cancelled.cancelReason).toBe('changed mind')
    })

    it('withCancellation throws when actor cannot cancel', () => {
        const o = order({status: 'delivering'})
        expect(() => withCancellation(o, 'customer', 'too late')).toThrow(CancellationNotAllowedError)
    })
})

describe('seller-order pricing', () => {
    it('sums subtotal across items', () => {
        const items = [
            item({unitPrice: 500, quantity: 2}),
            item({id: asSellerOrderItemId(2), unitPrice: 300, quantity: 1}),
        ]
        expect(calcItemsSubtotal(items)).toBe(1300)
    })

    it('sums customization delta across items scaled by quantity', () => {
        const items = [
            item({customizationDelta: 100, quantity: 2}),
            item({id: asSellerOrderItemId(2), customizationDelta: 50, quantity: 1}),
        ]
        expect(calcItemsCustomizationDelta(items)).toBe(250)
    })

    it('calcPricing applies commission to subtotal + customization', () => {
        const p = calcPricing({subtotal: 1000, customizationDelta: 200, shipping: 150, commissionRate: 0.1})
        expect(p.total).toBe(1350)
        expect(p.commissionAmount).toBe(120)
    })

    it('calcPricing with zero commission gives zero fee', () => {
        const p = calcPricing({subtotal: 1000, customizationDelta: 0, shipping: 0, commissionRate: 0})
        expect(p.commissionAmount).toBe(0)
        expect(p.total).toBe(1000)
    })
})
