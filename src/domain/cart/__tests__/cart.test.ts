import {addItem, applyPromo, clear, EMPTY_CART, isEmpty, itemsCount, removeItem, updateQuantity,} from '../cart'
import {calcTotals} from '../totals'
import {asProductId} from '@/src/domain/shared/id'

const sample = (id: number, price = 10) => ({
    productId: asProductId(id),
    name: `p${id}`,
    price,
    image: '',
    seller: 's',
})

describe('cart', () => {
    it('addItem adds new item with qty 1', () => {
        const c = addItem(EMPTY_CART, sample(1))
        expect(c.items).toHaveLength(1)
        expect(c.items[0].quantity).toBe(1)
    })

    it('addItem increments qty on duplicate', () => {
        const c = addItem(addItem(EMPTY_CART, sample(1)), sample(1), 2)
        expect(c.items[0].quantity).toBe(3)
    })

    it('removeItem drops matching productId', () => {
        const c = addItem(EMPTY_CART, sample(1))
        expect(removeItem(c, asProductId(1)).items).toHaveLength(0)
    })

    it('updateQuantity ignores qty < 1', () => {
        const c = addItem(EMPTY_CART, sample(1))
        expect(updateQuantity(c, asProductId(1), 0)).toBe(c)
    })

    it('clear returns empty cart', () => {
        const c = addItem(EMPTY_CART, sample(1))
        expect(isEmpty(clear(c))).toBe(true)
    })

    it('itemsCount sums quantities', () => {
        const c = addItem(addItem(EMPTY_CART, sample(1)), sample(2))
        expect(itemsCount(updateQuantity(c, asProductId(1), 4))).toBe(5)
    })

    it('calcTotals: free shipping over 50', () => {
        const c = addItem(EMPTY_CART, sample(1, 60))
        const t = calcTotals(c)
        expect(t.subtotal).toBe(60)
        expect(t.shipping).toBe(0)
        expect(t.discount).toBe(0)
        expect(t.tax).toBeCloseTo(4.8)
        expect(t.total).toBeCloseTo(64.8)
    })

    it('calcTotals: promo applies 10% discount', () => {
        const c = applyPromo(addItem(EMPTY_CART, sample(1, 100)), 'SUMMER')
        const t = calcTotals(c)
        expect(t.discount).toBe(10)
        expect(t.total).toBeCloseTo(100 - 10 + (100 - 10) * 0.08)
    })
})
