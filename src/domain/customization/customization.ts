import type {
    CustomizationMessageId,
    CustomizationOfferId,
    CustomizationThreadId,
    ProductOptionValueId,
    SellerOrderItemId,
} from '@/src/domain/shared/id'

export type CustomizationThreadStatus = 'open' | 'awaiting_seller_finalize' | 'agreed' | 'rejected'

const WRITABLE_STATUSES: ReadonlySet<CustomizationThreadStatus> = new Set([
    'open',
    'awaiting_seller_finalize',
])

export type MessageAuthor = 'customer' | 'seller'

export interface CustomIngredientSpec {
    readonly key: string
    readonly name: string
    readonly unit: string
    readonly amount: number
    readonly priceDelta: number
    readonly saveToLibrary: boolean
}

export interface CustomizationSpecSnapshot {
    readonly optionSelections: ReadonlyArray<ProductOptionValueId>
    readonly customIngredients: ReadonlyArray<CustomIngredientSpec>
    readonly sellerNotes: string
    readonly customerNotes: string
}

export interface CustomizationOffer {
    readonly id: CustomizationOfferId
    readonly version: number
    readonly spec: CustomizationSpecSnapshot
    readonly priceDelta: number
    readonly createdAt: Date
    readonly supersededByOfferId: CustomizationOfferId | null
}

export interface CustomizationMessage {
    readonly id: CustomizationMessageId
    readonly author: MessageAuthor
    readonly body: string
    readonly attachmentUrls: ReadonlyArray<string>
    readonly createdAt: Date
}

export interface CustomizationThread {
    readonly id: CustomizationThreadId
    readonly sellerOrderItemId: SellerOrderItemId
    readonly status: CustomizationThreadStatus
    readonly offers: ReadonlyArray<CustomizationOffer>
    readonly messages: ReadonlyArray<CustomizationMessage>
    readonly agreedOfferId: CustomizationOfferId | null
}

export class CustomizationThreadClosedError extends Error {
    constructor(status: CustomizationThreadStatus) {
        super(`Customization thread is ${status}; action not allowed`)
        this.name = 'CustomizationThreadClosedError'
    }
}

export class OfferNotFoundError extends Error {
    constructor(id: CustomizationOfferId) {
        super(`Offer ${id} not found in thread`)
        this.name = 'OfferNotFoundError'
    }
}

export class OfferSupersededError extends Error {
    constructor(id: CustomizationOfferId) {
        super(`Offer ${id} has been superseded and cannot be accepted`)
        this.name = 'OfferSupersededError'
    }
}

export class NoActiveOfferError extends Error {
    constructor() {
        super('No active offer to accept in thread')
        this.name = 'NoActiveOfferError'
    }
}

function assertWritable(thread: CustomizationThread): void {
    if (!WRITABLE_STATUSES.has(thread.status)) {
        throw new CustomizationThreadClosedError(thread.status)
    }
}

function assertOpen(thread: CustomizationThread): void {
    if (thread.status !== 'open') throw new CustomizationThreadClosedError(thread.status)
}

export function isWritable(thread: CustomizationThread): boolean {
    return WRITABLE_STATUSES.has(thread.status)
}

export function latestOffer(thread: CustomizationThread): CustomizationOffer | null {
    const active = thread.offers.filter((o) => o.supersededByOfferId === null)
    if (active.length === 0) return null
    return active.reduce((a, b) => (a.version >= b.version ? a : b))
}

export function L(
    thread: CustomizationThread,
    message: CustomizationMessage,
): CustomizationThread {
    return postMessage(thread, message)
}

export function postMessage(
    thread: CustomizationThread,
    message: CustomizationMessage,
): CustomizationThread {
    assertWritable(thread)
    return {...thread, messages: [...thread.messages, message]}
}

export function submitOffer(
    thread: CustomizationThread,
    offer: Omit<CustomizationOffer, 'version' | 'supersededByOfferId'>,
): CustomizationThread {
    assertWritable(thread)
    const prev = latestOffer(thread)
    const nextVersion = (prev?.version ?? 0) + 1
    const supersededOffers = thread.offers.map((o) =>
        o.supersededByOfferId === null ? {...o, supersededByOfferId: offer.id} : o,
    )
    const newOffer: CustomizationOffer = {
        ...offer,
        version: nextVersion,
        supersededByOfferId: null,
    }
    return {
        ...thread,
        status: 'open',
        agreedOfferId: null,
        offers: [...supersededOffers, newOffer],
    }
}

export function requestRevision(thread: CustomizationThread): CustomizationThread {
    assertWritable(thread)
    if (latestOffer(thread) === null) throw new NoActiveOfferError()
    const offers = thread.offers.map((o) =>
        o.supersededByOfferId === null ? {...o, supersededByOfferId: o.id} : o,
    )
    return {...thread, status: 'open', agreedOfferId: null, offers}
}

export function acceptOffer(
    thread: CustomizationThread,
    offerId: CustomizationOfferId,
): CustomizationThread {
    assertOpen(thread)
    const offer = thread.offers.find((o) => o.id === offerId)
    if (!offer) throw new OfferNotFoundError(offerId)
    if (offer.supersededByOfferId !== null) throw new OfferSupersededError(offerId)
    return {...thread, status: 'awaiting_seller_finalize', agreedOfferId: offer.id}
}

export function finalizeAgreement(
    thread: CustomizationThread,
): CustomizationThread {
    if (thread.status !== 'awaiting_seller_finalize') {
        throw new CustomizationThreadClosedError(thread.status)
    }
    if (thread.agreedOfferId === null) throw new NoActiveOfferError()
    return {...thread, status: 'agreed'}
}

export function rejectThread(thread: CustomizationThread): CustomizationThread {
    assertOpen(thread)
    return {...thread, status: 'rejected'}
}
