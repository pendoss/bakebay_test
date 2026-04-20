import type {CustomizationStorage} from '@/src/application/ports/customization-storage'
import type {CustomizationThreadId} from '@/src/domain/shared/id'
import {CustomizationThreadClosedError, isWritable, type MessageAuthor} from '@/src/domain/customization'

export class ThreadNotFoundError extends Error {
    constructor(id: CustomizationThreadId) {
        super(`Customization thread ${id} not found`)
        this.name = 'ThreadNotFoundError'
    }
}

export interface PostCustomizationMessageInput {
    readonly threadId: CustomizationThreadId
    readonly author: MessageAuthor
    readonly body: string
    readonly attachmentUrls?: ReadonlyArray<string>
}

export async function postCustomizationMessage(
    input: PostCustomizationMessageInput,
    deps: { customizationStorage: CustomizationStorage },
): Promise<void> {
    const thread = await deps.customizationStorage.findThread(input.threadId)
    if (!thread) throw new ThreadNotFoundError(input.threadId)
    if (!isWritable(thread)) throw new CustomizationThreadClosedError(thread.status)
    await deps.customizationStorage.appendMessage(input.threadId, {
        author: input.author,
        body: input.body,
        attachmentUrls: input.attachmentUrls ?? [],
    })
}
