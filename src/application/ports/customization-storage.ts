import type {
    CustomizationMessageId,
    CustomizationOfferId,
    CustomizationThreadId,
    SellerOrderItemId,
} from '@/src/domain/shared/id'
import type {
    CustomizationMessage,
    CustomizationOffer,
    CustomizationSpecSnapshot,
    CustomizationThread,
    MessageAuthor,
} from '@/src/domain/customization'

export interface CustomizationStorage {
    createThread(sellerOrderItemId: SellerOrderItemId): Promise<CustomizationThreadId>

    findThread(id: CustomizationThreadId): Promise<CustomizationThread | null>

    findThreadByItem(itemId: SellerOrderItemId): Promise<CustomizationThread | null>

    appendMessage(
        threadId: CustomizationThreadId,
        draft: { author: MessageAuthor; body: string; attachmentUrls: ReadonlyArray<string> },
    ): Promise<CustomizationMessageId>

    appendOffer(
        threadId: CustomizationThreadId,
        draft: { spec: CustomizationSpecSnapshot; priceDelta: number; supersededPriorActive: boolean },
    ): Promise<CustomizationOfferId>

    markOfferSuperseded(offerId: CustomizationOfferId, bySupersededBy: CustomizationOfferId): Promise<void>

    markAllActiveOffersSuperseded(threadId: CustomizationThreadId): Promise<void>

    updateThreadStatus(
        threadId: CustomizationThreadId,
        status: CustomizationThread['status'],
        agreedOfferId: CustomizationOfferId | null,
    ): Promise<void>

    saveFinalSpec(params: {
        threadId: CustomizationThreadId
        offerId: CustomizationOfferId
        spec: CustomizationSpecSnapshot
        priceDelta: number
    }): Promise<void>
}

export type PublicCustomizationOffer = CustomizationOffer
export type PublicCustomizationMessage = CustomizationMessage
