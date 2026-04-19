import {
    canTransition,
    assertTransition,
    aggregateIngredients,
    calcOrderTotal,
    InvalidOrderStatusTransitionError
} from '../index'
import type {OrderItem} from '../index'
import {asOrderItemId, asProductId} from '@/src/domain/shared/id'

const item = (over: Partial<OrderItem> = {}): OrderItem => ({
    id: asOrderItemId(1),
    productId: asProductId(10),
    name: 'Cake',
    quantity: 2,
    ingredients: [],
    ...over,
})

describe('order domain', () => {
    it('canTransition respects the allowed graph', () => {
        expect(canTransition('ordering', 'processing')).toBe(true)
        expect(canTransition('processing', 'payed')).toBe(true)
        expect(canTransition('ordering', 'delivered')).toBe(false)
        expect(canTransition('delivered', 'processing')).toBe(false)
    })

    it('assertTransition throws on invalid transition', () => {
        expect(() => assertTransition('ordering', 'delivered')).toThrow(InvalidOrderStatusTransitionError)
    })

    it('calcOrderTotal multiplies quantity by unit price', () => {
        const items = [item({productId: asProductId(1), quantity: 2}), item({productId: asProductId(2), quantity: 3})]
        const total = calcOrderTotal(items, {1: 100, 2: 50})
        expect(total).toBe(2 * 100 + 3 * 50)
    })

    it('aggregateIngredients sums scaled amounts per name+unit', () => {
        const items: OrderItem[] = [
            item({quantity: 2, ingredients: [{name: 'flour', unit: 'g', amount: 100}]}),
            item({
                quantity: 3,
                ingredients: [{name: 'flour', unit: 'g', amount: 50}, {name: 'sugar', unit: 'g', amount: 20}]
            }),
        ]
        const res = aggregateIngredients(items)
        expect(res).toEqual(expect.arrayContaining([
            {name: 'flour', unit: 'g', amount: 350},
            {name: 'sugar', unit: 'g', amount: 60},
        ]))
    })
})
