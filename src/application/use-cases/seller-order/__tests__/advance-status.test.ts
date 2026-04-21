import {advanceSellerOrderStatus, SellerOrderOwnershipError} from '../advance-status'
import {cancelSellerOrder} from '../cancel'
import {
    makeCommissionLookup,
    makeInMemoryStorages,
    makeProductLookup,
    productRecord,
} from '../../_test-support/in-memory-storages'
import {checkout} from '../../customer-order/checkout'
import {InvalidSellerOrderTransitionError} from '@/src/domain/seller-order'
import {asProductId, asSellerId, asUserId} from '@/src/domain/shared/id'

async function setupWithTwoSellers() {
    const storages = makeInMemoryStorages()
    const productLookup = makeProductLookup([
        productRecord(1, 7, 500),
        productRecord(2, 9, 1000),
    ])
    const commissionLookup = makeCommissionLookup({7: 0.1, 9: 0.2})
    const checkoutResult = await checkout(
        {
            userId: asUserId(1),
            address: 'addr',
            paymentMethod: 'card',
            lines: [
                {productId: asProductId(1), quantity: 1},
                {productId: asProductId(2), quantity: 1},
            ],
        },
        {customerOrderStorage: storages.customerOrderStorage, productLookup, commissionLookup},
    )
    return {...storages, checkoutResult}
}

describe('advanceSellerOrderStatus', () => {
    it('non-custom happy path: pending_seller_review → confirmed → paid → preparing → delivered', async () => {
        const {customerOrderStorage, sellerOrderStorage, checkoutResult} = await setupWithTwoSellers()
        const targetId = checkoutResult.sellerOrderIds[0]
        const target = await sellerOrderStorage.findById(targetId)
        if (!target) throw new Error('sub not found')
        const sellerId = target.sellerId
        const deps = {sellerOrderStorage, customerOrderStorage}

        for (const next of ['confirmed', 'paid', 'preparing', 'ready_to_ship', 'delivering', 'delivered'] as const) {
            await advanceSellerOrderStatus({sellerOrderId: targetId, actingSellerId: sellerId, next}, deps)
        }
        const finalState = await sellerOrderStorage.findById(targetId)
        expect(finalState?.status).toBe('delivered')
    })

    it('rejects seller who is not the owner of the sub-order', async () => {
        const {customerOrderStorage, sellerOrderStorage, checkoutResult} = await setupWithTwoSellers()
        const foreignId = checkoutResult.sellerOrderIds[1]
        const deps = {sellerOrderStorage, customerOrderStorage}
        await expect(
            advanceSellerOrderStatus(
                {sellerOrderId: foreignId, actingSellerId: asSellerId(7), next: 'confirmed'},
                deps,
            ),
        ).rejects.toThrow(SellerOrderOwnershipError)
    })

    it('refuses an invalid transition even from the rightful owner', async () => {
        const {customerOrderStorage, sellerOrderStorage, checkoutResult} = await setupWithTwoSellers()
        const id = checkoutResult.sellerOrderIds[0]
        const target = await sellerOrderStorage.findById(id)
        const deps = {sellerOrderStorage, customerOrderStorage}
        if (!target) throw new Error('sub not found')
        await expect(
            advanceSellerOrderStatus(
                {sellerOrderId: id, actingSellerId: target.sellerId, next: 'delivered'},
                deps,
            ),
        ).rejects.toThrow(InvalidSellerOrderTransitionError)
    })

    it('recomputes CustomerOrder.derivedStatus after each transition', async () => {
        const {customerOrderStorage, sellerOrderStorage, checkoutResult} = await setupWithTwoSellers()
        const [a, b] = checkoutResult.sellerOrderIds
        const subA = await sellerOrderStorage.findById(a)
        const subB = await sellerOrderStorage.findById(b)
        if (!subA || !subB) throw new Error('sub not found')
        const deps = {sellerOrderStorage, customerOrderStorage}

        await advanceSellerOrderStatus({sellerOrderId: a, actingSellerId: subA.sellerId, next: 'confirmed'}, deps)
        let root = await customerOrderStorage.findById(checkoutResult.customerOrderId)
        expect(root?.derivedStatus).toBe('negotiating')

        await advanceSellerOrderStatus({sellerOrderId: b, actingSellerId: subB.sellerId, next: 'confirmed'}, deps)
        root = await customerOrderStorage.findById(checkoutResult.customerOrderId)
        expect(root?.derivedStatus).toBe('awaiting_payment')

        await advanceSellerOrderStatus({sellerOrderId: a, actingSellerId: subA.sellerId, next: 'paid'}, deps)
        root = await customerOrderStorage.findById(checkoutResult.customerOrderId)
        expect(root?.derivedStatus).toBe('partially_paid')
    })
})

describe('cancelSellerOrder', () => {
    it('customer cancels a pending_seller_review sub, siblings unaffected', async () => {
        const {customerOrderStorage, sellerOrderStorage, checkoutResult} = await setupWithTwoSellers()
        const [a, b] = checkoutResult.sellerOrderIds
        await cancelSellerOrder(
            {sellerOrderId: a, actor: 'customer', reason: 'changed mind'},
            {sellerOrderStorage, customerOrderStorage},
        )
        const subA = await sellerOrderStorage.findById(a)
        const subB = await sellerOrderStorage.findById(b)
        expect(subA?.status).toBe('cancelled')
        expect(subA?.cancelReason).toBe('changed mind')
        expect(subB?.status).toBe('pending_seller_review')
    })

    it('all-cancelled propagates to CustomerOrder.derivedStatus = cancelled', async () => {
        const {customerOrderStorage, sellerOrderStorage, checkoutResult} = await setupWithTwoSellers()
        const deps = {sellerOrderStorage, customerOrderStorage}
        for (const id of checkoutResult.sellerOrderIds) {
            await cancelSellerOrder({sellerOrderId: id, actor: 'customer', reason: 'bye'}, deps)
        }
        const root = await customerOrderStorage.findById(checkoutResult.customerOrderId)
        expect(root?.derivedStatus).toBe('cancelled')
    })

    it('seller acting on foreign order is rejected', async () => {
        const {customerOrderStorage, sellerOrderStorage, checkoutResult} = await setupWithTwoSellers()
        const deps = {sellerOrderStorage, customerOrderStorage}
        await expect(
            cancelSellerOrder(
                {
                    sellerOrderId: checkoutResult.sellerOrderIds[1],
                    actor: 'seller',
                    actingSellerId: asSellerId(7),
                    reason: 'hostile',
                },
                deps,
            ),
        ).rejects.toThrow(SellerOrderOwnershipError)
    })
})
