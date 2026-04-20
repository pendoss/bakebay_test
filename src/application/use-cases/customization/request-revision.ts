import type {CustomizationStorage} from '@/src/application/ports/customization-storage'
import type {CustomizationThreadId} from '@/src/domain/shared/id'
import {
    CustomizationThreadClosedError,
    isWritable,
    NoActiveOfferError,
} from '@/src/domain/customization'
import {ThreadNotFoundError} from './post-message'

export interface RequestRevisionInput {
    readonly threadId: CustomizationThreadId
    readonly note?: string
}

export async function requestCustomizationRevision(
    input: RequestRevisionInput,
    deps: { customizationStorage: CustomizationStorage },
): Promise<void> {
    const thread = await deps.customizationStorage.findThread(input.threadId)
    if (!thread) throw new ThreadNotFoundError(input.threadId)
    if (!isWritable(thread)) throw new CustomizationThreadClosedError(thread.status)
    const hasActive = thread.offers.some((o) => o.supersededByOfferId === null)
    if (!hasActive) throw new NoActiveOfferError()
    await deps.customizationStorage.markAllActiveOffersSuperseded(input.threadId)
    if (input.note && input.note.length > 0) {
        await deps.customizationStorage.appendMessage(input.threadId, {
            author: 'customer',
            body: input.note,
            attachmentUrls: [],
        })
    }
}
