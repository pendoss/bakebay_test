import {advanceSellerOrderStatus} from '../advance-status'
import {
    approveSellerOrderRefund,
    RefundOwnershipError,
    requestSellerOrderRefund,
} from '../refund'
import {
    makeCommissionLookup,
    makeInMemoryStockStorages,
    makeInMemoryStorages,
    makeProductLookup,
    productRecord,
} from '../../_test-support/in-memory-storages'
import {checkout} from '../../customer-order/checkout'
import {RefundNotAllowedError} from '@/src/domain/seller-order'
import {SellerOrderOwnershipError} from '../advance-status'
import {asProductId, asSellerId, asUserId} from '@/src/domain/shared/id'

async function setupPaid() {
    const storages = makeInMemoryStorages()
    const productLookup = makeProductLookup([productRecord(1, 7, 500)])
    const commissionLookup = makeCommissionLookup({7: 0.1})
    const checkoutResult = await checkout(
        {
            userId: asUserId(42),
            address: 'addr',
            paymentMethod: 'card',
            lines: [{productId: asProductId(1), quantity: 1}],
        },
        {customerOrderStorage: storages.customerOrderStorage, productLookup, commissionLookup},
    )
    const stock = makeInMemoryStockStorages({
        stockByKey: {},
        requiredBySellerOrder: new Map(),
    })
    const id = checkoutResult.sellerOrderIds[0]
    const order = await storages.sellerOrderStorage.findById(id)
    if (!order) throw new Error('seed failed')
    for (const next of ['confirmed', 'paid'] as const) {
        await advanceSellerOrderStatus(
            {sellerOrderId: id, actingSellerId: order.sellerId, next},
            {
                sellerOrderStorage: storages.sellerOrderStorage,
                customerOrderStorage: storages.customerOrderStorage,
                stock: {
                    ingredientStorage: stock.ingredientStorage,
                    reservationStorage: stock.reservationStorage,
                },
            },
        )
    }
    return {...storages, ...stock, checkoutResult, sellerOrderId: id, sellerId: order.sellerId}
}

describe('requestSellerOrderRefund', () => {
    it('customer in paid can request refund', async () => {
        const s = await setupPaid()
        await requestSellerOrderRefund(
            {
                sellerOrderId: s.sellerOrderId,
                actor: 'customer',
                actingUserId: asUserId(42),
                reason: 'late',
            },
            {sellerOrderStorage: s.sellerOrderStorage, customerOrderStorage: s.customerOrderStorage},
        )
        const updated = await s.sellerOrderStorage.findById(s.sellerOrderId)
        expect(updated?.refundState).toBe('requested')
        expect(updated?.refundReason).toBe('late')
    })

    it('rejects customer from a different order', async () => {
        const s = await setupPaid()
        await expect(
            requestSellerOrderRefund(
                {
                    sellerOrderId: s.sellerOrderId,
                    actor: 'customer',
                    actingUserId: asUserId(999),
                    reason: 'hostile',
                },
                {sellerOrderStorage: s.sellerOrderStorage, customerOrderStorage: s.customerOrderStorage},
            ),
        ).rejects.toThrow(RefundOwnershipError)
    })

    it('rejects seller who does not own the order', async () => {
        const s = await setupPaid()
        await expect(
            requestSellerOrderRefund(
                {
                    sellerOrderId: s.sellerOrderId,
                    actor: 'seller',
                    actingSellerId: asSellerId(555),
                    reason: 'hostile',
                },
                {sellerOrderStorage: s.sellerOrderStorage, customerOrderStorage: s.customerOrderStorage},
            ),
        ).rejects.toThrow(SellerOrderOwnershipError)
    })

    it('refuses refund request in ineligible status (confirmed, not paid)', async () => {
        const storages = makeInMemoryStorages()
        const productLookup = makeProductLookup([productRecord(1, 7, 500)])
        const commissionLookup = makeCommissionLookup({7: 0.1})
        const checkoutResult = await checkout(
            {
                userId: asUserId(42),
                address: 'addr',
                paymentMethod: 'card',
                lines: [{productId: asProductId(1), quantity: 1}],
            },
            {customerOrderStorage: storages.customerOrderStorage, productLookup, commissionLookup},
        )
        await expect(
            requestSellerOrderRefund(
                {
                    sellerOrderId: checkoutResult.sellerOrderIds[0],
                    actor: 'customer',
                    actingUserId: asUserId(42),
                    reason: 'too early',
                },
                {sellerOrderStorage: storages.sellerOrderStorage, customerOrderStorage: storages.customerOrderStorage},
            ),
        ).rejects.toThrow(RefundNotAllowedError)
    })
})

describe('approveSellerOrderRefund', () => {
    it('transitions status to cancelled and derived becomes cancelled', async () => {
        const s = await setupPaid()
        await requestSellerOrderRefund(
            {
                sellerOrderId: s.sellerOrderId,
                actor: 'customer',
                actingUserId: asUserId(42),
                reason: 'late',
            },
            {sellerOrderStorage: s.sellerOrderStorage, customerOrderStorage: s.customerOrderStorage},
        )
        await approveSellerOrderRefund(
            {sellerOrderId: s.sellerOrderId},
            {
                sellerOrderStorage: s.sellerOrderStorage,
                customerOrderStorage: s.customerOrderStorage,
                reservationStorage: s.reservationStorage,
            },
        )
        const updated = await s.sellerOrderStorage.findById(s.sellerOrderId)
        expect(updated?.status).toBe('cancelled')
        expect(updated?.refundState).toBe('approved')
        const root = await s.customerOrderStorage.findById(s.checkoutResult.customerOrderId)
        expect(root?.derivedStatus).toBe('cancelled')
    })
})
