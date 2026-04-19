import {computeStatus, applyDeduction, applyRestock, isLowOrOut, shortageAmount} from '../index'
import type {Ingredient} from '../index'
import {asIngredientId, asProductId} from '@/src/domain/shared/id'

const make = (over: Partial<Ingredient> = {}): Ingredient => ({
    id: asIngredientId(1),
    productId: asProductId(1),
    name: 'flour',
    unit: 'g',
    amount: 100,
    stock: 500,
    alert: 50,
    status: 'ok',
    purchaseQty: 1000,
    purchasePrice: 100,
    ...over,
})

describe('ingredient domain', () => {
    it('computeStatus: out/low/ok thresholds', () => {
        expect(computeStatus(0, 10)).toBe('out')
        expect(computeStatus(-1, 10)).toBe('out')
        expect(computeStatus(10, 10)).toBe('low')
        expect(computeStatus(11, 10)).toBe('ok')
    })

    it('applyDeduction updates stock and status', () => {
        const res = applyDeduction(make({stock: 100, alert: 20}), 90)
        expect(res.stock).toBe(10)
        expect(res.status).toBe('low')
    })

    it('applyRestock updates stock/unit/alert/status', () => {
        const res = applyRestock(make({stock: 0, alert: 10, unit: 'kg'}), 100, 'g', 20)
        expect(res.stock).toBe(100)
        expect(res.unit).toBe('g')
        expect(res.alert).toBe(20)
        expect(res.status).toBe('ok')
    })

    it('isLowOrOut respects status', () => {
        expect(isLowOrOut(make({status: 'ok'}))).toBe(false)
        expect(isLowOrOut(make({status: 'low'}))).toBe(true)
        expect(isLowOrOut(make({status: 'out'}))).toBe(true)
    })

    it('shortageAmount never negative', () => {
        expect(shortageAmount(make({stock: 100}), 150)).toBe(50)
        expect(shortageAmount(make({stock: 200}), 150)).toBe(0)
    })
})
