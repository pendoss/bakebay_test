import {
    aggregateNeeded,
    packagesFor,
    buildPurchaseList,
    sumCost,
    ingredientPricePerUnit,
    csvRow,
    hasMissingPrices,
} from '../index'
import type {IngredientSnapshot, OrderSnapshot} from '../index'

const orders: OrderSnapshot[] = [
    {
        status: 'ordering',
        items: [
            {
                name: 'Cake',
                quantity: 2,
                ingredients: [
                    {name: 'flour', amount: 100, unit: 'g'},
                    {name: 'sugar', amount: 50, unit: 'g'},
                ],
            },
        ],
    },
    {
        status: 'ordering',
        items: [
            {
                name: 'Cake',
                quantity: 1,
                ingredients: [
                    {name: 'flour', amount: 100, unit: 'g'},
                ],
            },
        ],
    },
]

describe('optimization domain', () => {
    it('aggregateNeeded sums amount*quantity per name', () => {
        expect(aggregateNeeded(orders)).toEqual({flour: 300, sugar: 100})
    })

    it('packagesFor uses ceil with clamp', () => {
        expect(packagesFor(0, 10)).toBe(0)
        expect(packagesFor(5, 0)).toBe(0)
        expect(packagesFor(25, 10)).toBe(3)
        expect(packagesFor(20, 10)).toBe(2)
    })

    it('buildPurchaseList respects stock and sums cost', () => {
        const ingredients: IngredientSnapshot[] = [
            {ingredientId: 1, name: 'flour', unit: 'g', stock: 100, purchaseQty: 500, purchasePrice: 50},
            {ingredientId: 2, name: 'sugar', unit: 'g', stock: 200, purchaseQty: 100, purchasePrice: 20},
        ]
        const list = buildPurchaseList(ingredients, {flour: 300, sugar: 100})
        expect(list[0]).toMatchObject({name: 'flour', packagesToBuy: 1, cost: 50})
        expect(list[1]).toMatchObject({name: 'sugar', packagesToBuy: 0, cost: 0})
        expect(sumCost(list)).toBe(50)
    })

    it('ingredientPricePerUnit guards div-by-zero', () => {
        expect(ingredientPricePerUnit(100, 0)).toBe(0)
        expect(ingredientPricePerUnit(100, 4)).toBe(25)
    })

    it('csvRow joins with semicolon', () => {
        expect(csvRow('a', 1, 'b')).toBe('a;1;b')
    })

    it('hasMissingPrices detects zero-priced items', () => {
        expect(hasMissingPrices([{
            ingredientId: 1,
            name: 'x',
            unit: '',
            stock: 0,
            purchaseQty: 10,
            purchasePrice: 0
        }])).toBe(true)
        expect(hasMissingPrices([{
            ingredientId: 1,
            name: 'x',
            unit: '',
            stock: 0,
            purchaseQty: 10,
            purchasePrice: 1
        }])).toBe(false)
    })
})
