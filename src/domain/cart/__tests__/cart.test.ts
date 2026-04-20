import {
    addItem,
    applyPromo,
    cartLineId,
    clear,
    EMPTY_CART,
    isEmpty,
    itemsCount,
    removeItem,
    updateQuantity,
} from '../cart'
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

    it('removeItem drops matching line', () => {
        const c = addItem(EMPTY_CART, sample(1))
        expect(removeItem(c, cartLineId(c.items[0])).items).toHaveLength(0)
    })

    it('removeItem only touches the matching variant', () => {
        const withOption = {...sample(1), optionSelections: [{groupId: 1, groupName: 'g', valueId: 9, label: 'L', priceDelta: 0}]}
        const c = addItem(addItem(EMPTY_CART, sample(1)), withOption)
        expect(c.items).toHaveLength(2)
        const next = removeItem(c, cartLineId(c.items[1]))
        expect(next.items).toHaveLength(1)
        expect(next.items[0].optionSelections).toBeUndefined()
    })

    it('updateQuantity ignores qty < 1', () => {
        const c = addItem(EMPTY_CART, sample(1))
        expect(updateQuantity(c, cartLineId(c.items[0]), 0)).toBe(c)
    })

    it('clear returns empty cart', () => {
        const c = addItem(EMPTY_CART, sample(1))
        expect(isEmpty(clear(c))).toBe(true)
    })

    it('itemsCount sums quantities', () => {
        const c = addItem(addItem(EMPTY_CART, sample(1)), sample(2))
        const firstLine = cartLineId(c.items[0])
        expect(itemsCount(updateQuantity(c, firstLine, 4))).toBe(5)
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
