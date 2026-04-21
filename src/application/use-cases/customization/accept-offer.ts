import type {CustomizationStorage} from '@/src/application/ports/customization-storage'
import type {CustomizationOfferId, CustomizationThreadId} from '@/src/domain/shared/id'
import {
    CustomizationThreadClosedError,
    OfferNotFoundError,
    OfferSupersededError,
} from '@/src/domain/customization'
import {ThreadNotFoundError} from './post-message'

export interface AcceptCustomizationOfferInput {
    readonly threadId: CustomizationThreadId
    readonly offerId: CustomizationOfferId
}

export async function acceptCustomizationOffer(
    input: AcceptCustomizationOfferInput,
    deps: { customizationStorage: CustomizationStorage },
): Promise<void> {
    const thread = await deps.customizationStorage.findThread(input.threadId)
    if (!thread) throw new ThreadNotFoundError(input.threadId)
    if (thread.status !== 'open') throw new CustomizationThreadClosedError(thread.status)
    const offer = thread.offers.find((o) => o.id === input.offerId)
    if (!offer) throw new OfferNotFoundError(input.offerId)
    if (offer.supersededByOfferId !== null) throw new OfferSupersededError(input.offerId)
    await deps.customizationStorage.updateThreadStatus(
        input.threadId,
        'awaiting_seller_finalize',
        input.offerId,
    )
}
