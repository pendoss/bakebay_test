import type {CustomizationStorage} from '@/src/application/ports/customization-storage'
import type {CustomizationThreadId} from '@/src/domain/shared/id'
import {
    CustomizationThreadClosedError,
    isWritable,
    type CustomizationSpecSnapshot,
} from '@/src/domain/customization'
import {ThreadNotFoundError} from './post-message'

export interface SubmitCustomizationOfferInput {
    readonly threadId: CustomizationThreadId
    readonly spec: CustomizationSpecSnapshot
    readonly priceDelta: number
}

export async function submitCustomizationOffer(
    input: SubmitCustomizationOfferInput,
    deps: { customizationStorage: CustomizationStorage },
): Promise<void> {
    const thread = await deps.customizationStorage.findThread(input.threadId)
    if (!thread) throw new ThreadNotFoundError(input.threadId)
    if (!isWritable(thread)) throw new CustomizationThreadClosedError(thread.status)
    const hasActive = thread.offers.some((o) => o.supersededByOfferId === null)
    await deps.customizationStorage.appendOffer(input.threadId, {
        spec: input.spec,
        priceDelta: input.priceDelta,
        supersededPriorActive: hasActive,
    })
}
