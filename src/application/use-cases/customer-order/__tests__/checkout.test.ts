import {checkout, EmptyCheckoutError, UnknownProductError} from '../checkout'
import {
    makeCommissionLookup,
    makeInMemoryStorages,
    makeProductLookup,
    productRecord,
} from '../../_test-support/in-memory-storages'
import {asProductId, asUserId} from '@/src/domain/shared/id'

describe('checkout use-case', () => {
    const baseInput = {
        userId: asUserId(42),
        address: '123 Main St',
        paymentMethod: 'card',
    }

    it('creates one CustomerOrder and one SellerOrder for single-seller cart', async () => {
        const {customerOrderStorage, sellerOrderStorage} = makeInMemoryStorages()
        const productLookup = makeProductLookup([productRecord(1, 7, 500), productRecord(2, 7, 300)])
        const commissionLookup = makeCommissionLookup({7: 0.12})

        const result = await checkout(
            {
                ...baseInput,
                lines: [
                    {productId: asProductId(1), quantity: 2},
                    {productId: asProductId(2), quantity: 1},
                ],
            },
            {customerOrderStorage, productLookup, commissionLookup},
        )

        expect(result.sellerOrderIds).toHaveLength(1)
        const sub = await sellerOrderStorage.findById(result.sellerOrderIds[0])
        expect(sub).not.toBeNull()
        expect(sub?.status).toBe('pending_seller_review')
        expect(sub?.items).toHaveLength(2)
        expect(sub?.pricing.subtotal).toBe(2 * 500 + 1 * 300)
        expect(sub?.pricing.commissionRate).toBe(0.12)
    })

    it('splits cart into N SellerOrders by seller_id', async () => {
        const {customerOrderStorage, sellerOrderStorage} = makeInMemoryStorages()
        const productLookup = makeProductLookup([
            productRecord(1, 7, 500),
            productRecord(2, 9, 1000),
            productRecord(3, 7, 200),
        ])
        const commissionLookup = makeCommissionLookup({7: 0.1, 9: 0.2})

        const result = await checkout(
            {
                ...baseInput,
                lines: [
                    {productId: asProductId(1), quantity: 2},
                    {productId: asProductId(2), quantity: 1},
                    {productId: asProductId(3), quantity: 3},
                ],
            },
            {customerOrderStorage, productLookup, commissionLookup},
        )

        expect(result.sellerOrderIds).toHaveLength(2)
        const subs = await Promise.all(result.sellerOrderIds.map((id) => sellerOrderStorage.findById(id)))
        const loaded = subs.filter((s): s is NonNullable<typeof s> => s !== null)
        const bySeller = new Map(loaded.map((s) => [s.sellerId as unknown as number, s]))
        expect(bySeller.get(7)?.items).toHaveLength(2)
        expect(bySeller.get(9)?.items).toHaveLength(1)
        expect(bySeller.get(7)?.pricing.commissionRate).toBe(0.1)
        expect(bySeller.get(9)?.pricing.commissionRate).toBe(0.2)
    })

    it('sets root CustomerOrder.derivedStatus to negotiating on creation', async () => {
        const {customerOrderStorage} = makeInMemoryStorages()
        const productLookup = makeProductLookup([productRecord(1, 7, 500)])
        const commissionLookup = makeCommissionLookup({})
        const result = await checkout(
            {...baseInput, lines: [{productId: asProductId(1), quantity: 1}]},
            {customerOrderStorage, productLookup, commissionLookup},
        )
        const root = await customerOrderStorage.findById(result.customerOrderId)
        expect(root?.derivedStatus).toBe('negotiating')
    })

    it('throws on empty cart', async () => {
        const {customerOrderStorage} = makeInMemoryStorages()
        const productLookup = makeProductLookup([])
        const commissionLookup = makeCommissionLookup({})
        await expect(
            checkout({...baseInput, lines: []}, {customerOrderStorage, productLookup, commissionLookup}),
        ).rejects.toThrow(EmptyCheckoutError)
    })

    it('throws UnknownProductError when cart references unknown product', async () => {
        const {customerOrderStorage} = makeInMemoryStorages()
        const productLookup = makeProductLookup([productRecord(1, 7, 500)])
        const commissionLookup = makeCommissionLookup({})
        await expect(
            checkout(
                {...baseInput, lines: [{productId: asProductId(99), quantity: 1}]},
                {customerOrderStorage, productLookup, commissionLookup},
            ),
        ).rejects.toThrow(UnknownProductError)
    })
})
