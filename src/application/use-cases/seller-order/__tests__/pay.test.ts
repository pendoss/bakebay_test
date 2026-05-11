import {paySellerOrder, SellerOrderAccessDeniedError} from '../pay'
import {
    makeCommissionLookup,
    makeInMemoryStorages,
    makeProductLookup,
    productRecord,
} from '../../_test-support/in-memory-storages'
import {checkout} from '../../customer-order/checkout'
import {InvalidSellerOrderTransitionError} from '@/src/domain/seller-order'
import {asProductId, asUserId} from '@/src/domain/shared/id'

async function setup(status: 'pending_seller_review' | 'confirmed' = 'confirmed') {
    const storages = makeInMemoryStorages()
    const productLookup = makeProductLookup([productRecord(1, 7, 500)])
    const commissionLookup = makeCommissionLookup({7: 0.1})
    const checkoutResult = await checkout(
        {
            userId: asUserId(42),
            address: 'x',
            paymentMethod: 'card',
            lines: [{productId: asProductId(1), quantity: 2}],
        },
        {customerOrderStorage: storages.customerOrderStorage, productLookup, commissionLookup},
    )
    const sub = await storages.sellerOrderStorage.findById(checkoutResult.sellerOrderIds[0])
    if (!sub) throw new Error('sub not found')
    if (status === 'confirmed') {
        await storages.sellerOrderStorage.updateStatus(sub.id, 'confirmed')
    }
    return {...storages, sellerOrderId: sub.id, customerOrderId: checkoutResult.customerOrderId}
}

describe('paySellerOrder', () => {
    it('transitions confirmed → paid and updates derived status', async () => {
        const {sellerOrderStorage, customerOrderStorage, sellerOrderId, customerOrderId} = await setup()
        const result = await paySellerOrder(
            {sellerOrderId, payingUserId: asUserId(42)},
            {sellerOrderStorage, customerOrderStorage},
        )
        expect(result.amount).toBe(1000)
        const sub = await sellerOrderStorage.findById(sellerOrderId)
        expect(sub?.status).toBe('paid')
        const root = await customerOrderStorage.findById(customerOrderId)
        expect(root?.derivedStatus).toBe('in_fulfillment')
    })

    it('refuses if the user is not the owner of the customer order', async () => {
        const {sellerOrderStorage, customerOrderStorage, sellerOrderId} = await setup()
        await expect(
            paySellerOrder(
                {sellerOrderId, payingUserId: asUserId(999)},
                {sellerOrderStorage, customerOrderStorage},
            ),
        ).rejects.toThrow(SellerOrderAccessDeniedError)
    })

    it('refuses to pay if the seller order is not confirmed yet', async () => {
        const {sellerOrderStorage, customerOrderStorage, sellerOrderId} = await setup('pending_seller_review')
        await expect(
            paySellerOrder(
                {sellerOrderId, payingUserId: asUserId(42)},
                {sellerOrderStorage, customerOrderStorage},
            ),
        ).rejects.toThrow(InvalidSellerOrderTransitionError)
    })
})
