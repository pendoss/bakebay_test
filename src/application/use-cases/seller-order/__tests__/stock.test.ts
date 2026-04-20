import {
    checkSellerOrderStock,
    consumeSellerOrderStock,
    releaseSellerOrderStock,
    reserveSellerOrderStock,
} from '../stock'
import {advanceSellerOrderStatus} from '../advance-status'
import {cancelSellerOrder} from '../cancel'
import {
    makeCommissionLookup,
    makeInMemoryStockStorages,
    makeInMemoryStorages,
    makeProductLookup,
    productRecord,
} from '../../_test-support/in-memory-storages'
import {checkout} from '../../customer-order/checkout'
import {asProductId, asUserId, type SellerOrderId} from '@/src/domain/shared/id'
import type {RequiredIngredient} from '@/src/domain/seller-order'

async function setup(
    requiredPerOrder: (sellerOrderIds: ReadonlyArray<SellerOrderId>) => Map<SellerOrderId, RequiredIngredient[]>,
    stockByKey: Record<string, {stock: number; alertThreshold: number}>,
) {
    const storages = makeInMemoryStorages()
    const productLookup = makeProductLookup([productRecord(1, 7, 500)])
    const commissionLookup = makeCommissionLookup({7: 0.1})
    const checkoutResult = await checkout(
        {
            userId: asUserId(1),
            address: 'addr',
            paymentMethod: 'card',
            lines: [{productId: asProductId(1), quantity: 2}],
        },
        {customerOrderStorage: storages.customerOrderStorage, productLookup, commissionLookup},
    )
    const stock = makeInMemoryStockStorages({
        stockByKey,
        requiredBySellerOrder: requiredPerOrder(checkoutResult.sellerOrderIds),
    })
    return {...storages, ...stock, checkoutResult}
}

const flour = (amount: number): RequiredIngredient => ({key: 'flour', name: 'Flour', unit: 'g', amount})
const sugar = (amount: number): RequiredIngredient => ({key: 'sugar', name: 'Sugar', unit: 'g', amount})

describe('checkSellerOrderStock', () => {
    it('returns overall=available and updates stockCheck=ok when stock comfortably covers', async () => {
        const s = await setup(
            (ids) => new Map([[ids[0], [flour(100), sugar(50)]]]),
            {flour: {stock: 1000, alertThreshold: 10}, sugar: {stock: 500, alertThreshold: 10}},
        )
        const report = await checkSellerOrderStock(
            {sellerOrderId: s.checkoutResult.sellerOrderIds[0]},
            {
                sellerOrderStorage: s.sellerOrderStorage,
                ingredientStorage: s.ingredientStorage,
                reservationStorage: s.reservationStorage,
            },
        )
        expect(report.overall).toBe('available')
        const order = await s.sellerOrderStorage.findById(s.checkoutResult.sellerOrderIds[0])
        expect(order?.stockCheck).toBe('ok')
    })

    it('overall=missing when an ingredient is absent from stock', async () => {
        const s = await setup(
            (ids) => new Map([[ids[0], [flour(100), sugar(50)]]]),
            {flour: {stock: 1000, alertThreshold: 10}},
        )
        const report = await checkSellerOrderStock(
            {sellerOrderId: s.checkoutResult.sellerOrderIds[0]},
            {
                sellerOrderStorage: s.sellerOrderStorage,
                ingredientStorage: s.ingredientStorage,
                reservationStorage: s.reservationStorage,
            },
        )
        expect(report.overall).toBe('missing')
        const missing = report.lines.find((l) => l.key === 'sugar')
        expect(missing?.status).toBe('missing')
    })

    it('excludes own reservations when recomputing', async () => {
        const s = await setup(
            (ids) => new Map([[ids[0], [flour(100)]]]),
            {flour: {stock: 150, alertThreshold: 10}},
        )
        await reserveSellerOrderStock(
            {sellerOrderId: s.checkoutResult.sellerOrderIds[0]},
            {
                sellerOrderStorage: s.sellerOrderStorage,
                ingredientStorage: s.ingredientStorage,
                reservationStorage: s.reservationStorage,
            },
        )
        const report = await checkSellerOrderStock(
            {sellerOrderId: s.checkoutResult.sellerOrderIds[0]},
            {
                sellerOrderStorage: s.sellerOrderStorage,
                ingredientStorage: s.ingredientStorage,
                reservationStorage: s.reservationStorage,
            },
        )
        expect(report.overall).not.toBe('missing')
    })
})

describe('reserveSellerOrderStock', () => {
    it('creates reservations, second call is noop', async () => {
        const s = await setup(
            (ids) => new Map([[ids[0], [flour(100)]]]),
            {flour: {stock: 1000, alertThreshold: 10}},
        )
        const deps = {
            sellerOrderStorage: s.sellerOrderStorage,
            ingredientStorage: s.ingredientStorage,
            reservationStorage: s.reservationStorage,
        }
        const id = s.checkoutResult.sellerOrderIds[0]
        await reserveSellerOrderStock({sellerOrderId: id}, deps)
        await reserveSellerOrderStock({sellerOrderId: id}, deps)
        const list = await s.reservationStorage.listBySellerOrder(id)
        expect(list).toHaveLength(1)
        expect(list[0].state).toBe('reserved')
    })
})

describe('consumeSellerOrderStock', () => {
    it('decrements stock by reserved amount and flips reservations to consumed', async () => {
        const s = await setup(
            (ids) => new Map([[ids[0], [flour(100)]]]),
            {flour: {stock: 300, alertThreshold: 10}},
        )
        const id = s.checkoutResult.sellerOrderIds[0]
        const deps = {
            sellerOrderStorage: s.sellerOrderStorage,
            ingredientStorage: s.ingredientStorage,
            reservationStorage: s.reservationStorage,
        }
        await reserveSellerOrderStock({sellerOrderId: id}, deps)
        await consumeSellerOrderStock({sellerOrderId: id}, deps)
        expect(s.stock.get('flour')?.stock).toBe(200)
        const list = await s.reservationStorage.listBySellerOrder(id)
        expect(list.every((r) => r.state === 'consumed')).toBe(true)
    })
})

describe('advanceSellerOrderStatus with stock deps', () => {
    it('auto-reserves on → confirmed', async () => {
        const s = await setup(
            (ids) => new Map([[ids[0], [flour(100)]]]),
            {flour: {stock: 500, alertThreshold: 10}},
        )
        const target = await s.sellerOrderStorage.findById(s.checkoutResult.sellerOrderIds[0])
        if (!target) throw new Error('sub missing')
        await advanceSellerOrderStatus(
            {sellerOrderId: target.id, actingSellerId: target.sellerId, next: 'confirmed'},
            {
                sellerOrderStorage: s.sellerOrderStorage,
                customerOrderStorage: s.customerOrderStorage,
                stock: {ingredientStorage: s.ingredientStorage, reservationStorage: s.reservationStorage},
            },
        )
        const list = await s.reservationStorage.listBySellerOrder(target.id)
        expect(list).toHaveLength(1)
        expect(list[0].state).toBe('reserved')
    })

    it('routes paid→preparing to preparing_blocked when stock missing', async () => {
        const s = await setup(
            (ids) => new Map([[ids[0], [flour(100)]]]),
            {flour: {stock: 50, alertThreshold: 10}},
        )
        const target = await s.sellerOrderStorage.findById(s.checkoutResult.sellerOrderIds[0])
        if (!target) throw new Error('sub missing')
        const depsFull = {
            sellerOrderStorage: s.sellerOrderStorage,
            customerOrderStorage: s.customerOrderStorage,
            stock: {ingredientStorage: s.ingredientStorage, reservationStorage: s.reservationStorage},
        }
        for (const next of ['confirmed', 'paid', 'preparing'] as const) {
            await advanceSellerOrderStatus(
                {sellerOrderId: target.id, actingSellerId: target.sellerId, next},
                depsFull,
            )
        }
        const final = await s.sellerOrderStorage.findById(target.id)
        expect(final?.status).toBe('preparing_blocked')
    })

    it('consumes on → ready_to_ship and releases on cancel', async () => {
        const s = await setup(
            (ids) => new Map([[ids[0], [flour(100)]]]),
            {flour: {stock: 500, alertThreshold: 10}},
        )
        const target = await s.sellerOrderStorage.findById(s.checkoutResult.sellerOrderIds[0])
        if (!target) throw new Error('sub missing')
        const depsFull = {
            sellerOrderStorage: s.sellerOrderStorage,
            customerOrderStorage: s.customerOrderStorage,
            stock: {ingredientStorage: s.ingredientStorage, reservationStorage: s.reservationStorage},
        }
        for (const next of ['confirmed', 'paid', 'preparing', 'ready_to_ship'] as const) {
            await advanceSellerOrderStatus(
                {sellerOrderId: target.id, actingSellerId: target.sellerId, next},
                depsFull,
            )
        }
        expect(s.stock.get('flour')?.stock).toBe(400)

        // Now cancel path — new sub order reservation to release
        const s2 = await setup(
            (ids) => new Map([[ids[0], [flour(100)]]]),
            {flour: {stock: 500, alertThreshold: 10}},
        )
        const t2 = await s2.sellerOrderStorage.findById(s2.checkoutResult.sellerOrderIds[0])
        if (!t2) throw new Error('sub missing')
        await advanceSellerOrderStatus(
            {sellerOrderId: t2.id, actingSellerId: t2.sellerId, next: 'confirmed'},
            {
                sellerOrderStorage: s2.sellerOrderStorage,
                customerOrderStorage: s2.customerOrderStorage,
                stock: {ingredientStorage: s2.ingredientStorage, reservationStorage: s2.reservationStorage},
            },
        )
        await cancelSellerOrder(
            {sellerOrderId: t2.id, actor: 'seller', actingSellerId: t2.sellerId, reason: 'oops'},
            {
                sellerOrderStorage: s2.sellerOrderStorage,
                customerOrderStorage: s2.customerOrderStorage,
                reservationStorage: s2.reservationStorage,
            },
        )
        const list = await s2.reservationStorage.listBySellerOrder(t2.id)
        expect(list.every((r) => r.state === 'released')).toBe(true)
    })
})

describe('releaseSellerOrderStock', () => {
    it('flips reserved to released, stock unchanged', async () => {
        const s = await setup(
            (ids) => new Map([[ids[0], [flour(100)]]]),
            {flour: {stock: 300, alertThreshold: 10}},
        )
        const id = s.checkoutResult.sellerOrderIds[0]
        const deps = {
            sellerOrderStorage: s.sellerOrderStorage,
            ingredientStorage: s.ingredientStorage,
            reservationStorage: s.reservationStorage,
        }
        await reserveSellerOrderStock({sellerOrderId: id}, deps)
        await releaseSellerOrderStock({sellerOrderId: id}, {reservationStorage: s.reservationStorage})
        expect(s.stock.get('flour')?.stock).toBe(300)
        const list = await s.reservationStorage.listBySellerOrder(id)
        expect(list.every((r) => r.state === 'released')).toBe(true)
    })
})
