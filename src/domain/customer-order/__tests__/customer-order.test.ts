import {computeDerivedStatus, EmptyCustomerOrderError} from '../customer-order'
import type {SellerOrderStatus} from '@/src/domain/seller-order'

describe('customer-order derived status', () => {
    it('throws on empty sub-orders', () => {
        expect(() => computeDerivedStatus([])).toThrow(EmptyCustomerOrderError)
    })

    it('negotiating when any sub is in pre-confirm states', () => {
        const subs: SellerOrderStatus[] = ['negotiating', 'confirmed']
        expect(computeDerivedStatus(subs)).toBe('negotiating')

        expect(computeDerivedStatus(['awaiting_customer_approval', 'delivered'])).toBe('negotiating')
        expect(computeDerivedStatus(['pending_seller_review'])).toBe('negotiating')
    })

    it('awaiting_payment when all active are confirmed', () => {
        expect(computeDerivedStatus(['confirmed', 'confirmed'])).toBe('awaiting_payment')
        expect(computeDerivedStatus(['confirmed', 'cancelled'])).toBe('awaiting_payment')
    })

    it('partially_paid when mix of confirmed and paid', () => {
        expect(computeDerivedStatus(['confirmed', 'paid'])).toBe('partially_paid')
    })

    it('in_fulfillment when at least one is in preparation/shipping', () => {
        expect(computeDerivedStatus(['paid', 'paid'])).toBe('in_fulfillment')
        expect(computeDerivedStatus(['preparing', 'paid'])).toBe('in_fulfillment')
        expect(computeDerivedStatus(['ready_to_ship', 'delivering'])).toBe('in_fulfillment')
        expect(computeDerivedStatus(['preparing_blocked', 'preparing'])).toBe('in_fulfillment')
    })

    it('partially_delivered when some delivered and others still progressing', () => {
        expect(computeDerivedStatus(['delivered', 'preparing'])).toBe('partially_delivered')
        expect(computeDerivedStatus(['delivered', 'delivering'])).toBe('partially_delivered')
    })

    it('delivered when all active delivered and no cancelled', () => {
        expect(computeDerivedStatus(['delivered', 'delivered'])).toBe('delivered')
    })

    it('partially_cancelled when some cancelled and rest delivered', () => {
        expect(computeDerivedStatus(['delivered', 'cancelled'])).toBe('partially_cancelled')
        expect(computeDerivedStatus(['delivered', 'delivered', 'cancelled'])).toBe('partially_cancelled')
    })

    it('cancelled when all sub are cancelled', () => {
        expect(computeDerivedStatus(['cancelled', 'cancelled'])).toBe('cancelled')
    })

    it('negotiating takes precedence over paid when a sibling is in negotiation', () => {
        expect(computeDerivedStatus(['negotiating', 'paid'])).toBe('negotiating')
    })
})
