import {aggregateRequired, checkIngredientAvailability} from '../stock'
import type {RequiredIngredient, StockEntry} from '../stock'

const entry = (over: Partial<StockEntry> & { key: string }): StockEntry => ({
    available: 0,
    alertThreshold: 0,
    ...over,
})

describe('stock availability check', () => {
    it('returns available when supply comfortably exceeds required + threshold', () => {
        const required: RequiredIngredient[] = [{key: 'flour', name: 'Flour', unit: 'g', amount: 200}]
        const stock = {flour: entry({key: 'flour', available: 1000, alertThreshold: 100})}
        const report = checkIngredientAvailability(required, stock)
        expect(report.overall).toBe('available')
        expect(report.lines[0].status).toBe('available')
    })

    it('returns low when leftover falls below alert threshold', () => {
        const required: RequiredIngredient[] = [{key: 'sugar', name: 'Sugar', unit: 'g', amount: 900}]
        const stock = {sugar: entry({key: 'sugar', available: 1000, alertThreshold: 200})}
        const report = checkIngredientAvailability(required, stock)
        expect(report.lines[0].status).toBe('low')
        expect(report.overall).toBe('low')
    })

    it('returns missing when required exceeds available', () => {
        const required: RequiredIngredient[] = [{key: 'cocoa', name: 'Cocoa', unit: 'g', amount: 500}]
        const stock = {cocoa: entry({key: 'cocoa', available: 100, alertThreshold: 0})}
        const report = checkIngredientAvailability(required, stock)
        expect(report.lines[0].status).toBe('missing')
        expect(report.overall).toBe('missing')
    })

    it('returns missing when ingredient is not in stock map at all', () => {
        const required: RequiredIngredient[] = [{key: 'ghost', name: 'Ghost', unit: 'g', amount: 1}]
        const report = checkIngredientAvailability(required, {})
        expect(report.lines[0].status).toBe('missing')
        expect(report.lines[0].available).toBe(0)
    })

    it('overall status is the worst of line statuses', () => {
        const required: RequiredIngredient[] = [
            {key: 'flour', name: 'Flour', unit: 'g', amount: 100},
            {key: 'sugar', name: 'Sugar', unit: 'g', amount: 900},
            {key: 'cocoa', name: 'Cocoa', unit: 'g', amount: 500},
        ]
        const stock = {
            flour: entry({key: 'flour', available: 1000, alertThreshold: 100}),
            sugar: entry({key: 'sugar', available: 1000, alertThreshold: 200}),
            cocoa: entry({key: 'cocoa', available: 100, alertThreshold: 0}),
        }
        const report = checkIngredientAvailability(required, stock)
        expect(report.overall).toBe('missing')
    })
})

describe('aggregateRequired', () => {
    it('sums amounts scaled by quantity across items', () => {
        const result = aggregateRequired([
            {quantity: 2, ingredients: [{key: 'flour', name: 'Flour', unit: 'g', amount: 100}]},
            {
                quantity: 3,
                ingredients: [
                    {key: 'flour', name: 'Flour', unit: 'g', amount: 50},
                    {key: 'sugar', name: 'Sugar', unit: 'g', amount: 20},
                ],
            },
        ])
        const flour = result.find((r) => r.key === 'flour')
        const sugar = result.find((r) => r.key === 'sugar')
        expect(flour?.amount).toBe(350)
        expect(sugar?.amount).toBe(60)
    })
})
