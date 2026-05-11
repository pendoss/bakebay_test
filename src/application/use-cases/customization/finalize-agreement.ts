import type {CustomizationStorage} from '@/src/application/ports/customization-storage'
import type {CustomizationThreadId} from '@/src/domain/shared/id'
import {
    CustomizationThreadClosedError,
    NoActiveOfferError,
    OfferNotFoundError,
} from '@/src/domain/customization'
import {ThreadNotFoundError} from './post-message'

export interface FinalizeAgreementInput {
    readonly threadId: CustomizationThreadId
}

export async function finalizeCustomizationAgreement(
    input: FinalizeAgreementInput,
    deps: { customizationStorage: CustomizationStorage },
): Promise<void> {
    const thread = await deps.customizationStorage.findThread(input.threadId)
    if (!thread) throw new ThreadNotFoundError(input.threadId)
    if (thread.status !== 'awaiting_seller_finalize') {
        throw new CustomizationThreadClosedError(thread.status)
    }
    if (thread.agreedOfferId === null) throw new NoActiveOfferError()

    const offer = thread.offers.find((o) => o.id === thread.agreedOfferId)
    if (!offer) throw new OfferNotFoundError(thread.agreedOfferId)

    await deps.customizationStorage.saveFinalSpec({
        threadId: input.threadId,
        offerId: offer.id,
        spec: offer.spec,
        priceDelta: offer.priceDelta,
    })
    await deps.customizationStorage.updateThreadStatus(input.threadId, 'agreed', thread.agreedOfferId)
}
