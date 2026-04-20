import {
    acceptOffer,
    CustomizationThreadClosedError,
    finalizeAgreement,
    isWritable,
    latestOffer,
    L as postMessage,
    NoActiveOfferError,
    OfferSupersededError,
    rejectThread,
    requestRevision,
    submitOffer,
} from '../customization'
import type {
    CustomizationMessage,
    CustomizationOffer,
    CustomizationThread,
} from '../customization'
import {
    asCustomizationMessageId,
    asCustomizationOfferId,
    asCustomizationThreadId,
    asSellerOrderItemId,
} from '@/src/domain/shared/id'

const thread = (): CustomizationThread => ({
    id: asCustomizationThreadId(1),
    sellerOrderItemId: asSellerOrderItemId(10),
    status: 'open',
    offers: [],
    messages: [],
    agreedOfferId: null,
})

const emptySpec = {
    optionSelections: [],
    customIngredients: [],
    sellerNotes: '',
    customerNotes: '',
}

const offer = (id: number, priceDelta = 100): Omit<CustomizationOffer, 'version' | 'supersededByOfferId'> => ({
    id: asCustomizationOfferId(id),
    spec: emptySpec,
    priceDelta,
    createdAt: new Date('2026-04-19T10:00:00Z'),
})

const message = (id: number, author: 'customer' | 'seller', body: string): CustomizationMessage => ({
    id: asCustomizationMessageId(id),
    author,
    body,
    attachmentUrls: [],
    createdAt: new Date(),
})

describe('customization thread', () => {
    it('postMessage appends to history', () => {
        const t = postMessage(thread(), message(1, 'customer', 'can you add pink frosting?'))
        expect(t.messages).toHaveLength(1)
        expect(t.messages[0].body).toBe('can you add pink frosting?')
    })

    it('submitOffer marks previous offer superseded and bumps version', () => {
        const t1 = submitOffer(thread(), offer(1, 100))
        expect(t1.offers).toHaveLength(1)
        expect(t1.offers[0].version).toBe(1)
        expect(latestOffer(t1)?.id).toBe(asCustomizationOfferId(1))

        const t2 = submitOffer(t1, offer(2, 150))
        expect(t2.offers).toHaveLength(2)
        const first = t2.offers.find((o) => o.id === asCustomizationOfferId(1))
        expect(first?.supersededByOfferId).toBe(asCustomizationOfferId(2))
        const second = t2.offers.find((o) => o.id === asCustomizationOfferId(2))
        expect(second?.version).toBe(2)
        expect(latestOffer(t2)?.id).toBe(asCustomizationOfferId(2))
    })

    it('requestRevision supersedes the latest offer', () => {
        const t1 = submitOffer(thread(), offer(1))
        const t2 = requestRevision(t1)
        expect(latestOffer(t2)).toBeNull()
    })

    it('requestRevision throws if there is no active offer', () => {
        expect(() => requestRevision(thread())).toThrow(NoActiveOfferError)
    })

    it('acceptOffer moves thread to awaiting_seller_finalize, still writable', () => {
        const t1 = submitOffer(thread(), offer(1))
        const t2 = acceptOffer(t1, asCustomizationOfferId(1))
        expect(t2.status).toBe('awaiting_seller_finalize')
        expect(t2.agreedOfferId).toBe(asCustomizationOfferId(1))
        expect(isWritable(t2)).toBe(true)
    })

    it('finalizeAgreement closes the thread only when both sides confirmed', () => {
        const t1 = submitOffer(thread(), offer(1))
        const accepted = acceptOffer(t1, asCustomizationOfferId(1))
        const agreed = finalizeAgreement(accepted)
        expect(agreed.status).toBe('agreed')
        expect(agreed.agreedOfferId).toBe(asCustomizationOfferId(1))
        expect(() => finalizeAgreement(thread())).toThrow(CustomizationThreadClosedError)
    })

    it('new offer during awaiting_seller_finalize reverts to open and drops prior acceptance', () => {
        const t1 = submitOffer(thread(), offer(1))
        const accepted = acceptOffer(t1, asCustomizationOfferId(1))
        const reopened = submitOffer(accepted, offer(2, 200))
        expect(reopened.status).toBe('open')
        expect(reopened.agreedOfferId).toBeNull()
        expect(latestOffer(reopened)?.id).toBe(asCustomizationOfferId(2))
    })

    it('requestRevision during awaiting_seller_finalize also reopens the thread', () => {
        const t1 = submitOffer(thread(), offer(1))
        const accepted = acceptOffer(t1, asCustomizationOfferId(1))
        const reopened = requestRevision(accepted)
        expect(reopened.status).toBe('open')
        expect(reopened.agreedOfferId).toBeNull()
    })

    it('acceptOffer refuses superseded offers', () => {
        const t1 = submitOffer(thread(), offer(1))
        const t2 = submitOffer(t1, offer(2))
        expect(() => acceptOffer(t2, asCustomizationOfferId(1))).toThrow(OfferSupersededError)
    })

    it('rejectThread moves it to rejected', () => {
        const t = rejectThread(thread())
        expect(t.status).toBe('rejected')
    })

    it('blocks further mutations once closed', () => {
        const pending = acceptOffer(submitOffer(thread(), offer(1)), asCustomizationOfferId(1))
        const agreed = finalizeAgreement(pending)
        expect(() => postMessage(agreed, message(1, 'customer', 'hi'))).toThrow(CustomizationThreadClosedError)
        expect(() => submitOffer(agreed, offer(9))).toThrow(CustomizationThreadClosedError)
        expect(() => requestRevision(agreed)).toThrow(CustomizationThreadClosedError)

        const rejected = rejectThread(thread())
        expect(() => submitOffer(rejected, offer(5))).toThrow(CustomizationThreadClosedError)
    })
})
