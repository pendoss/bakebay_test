import {and, eq, isNull} from 'drizzle-orm'
import {
    db,
    customizationThreads,
    customizationOffers,
    customizationMessages,
    customizationFinalSpecs,
    sellerOrderItems,
} from '@/src/adapters/storage/drizzle'
import type {
    CustomizationStorage,
} from '@/src/application/ports/customization-storage'
import type {
    CustomizationMessage,
    CustomizationOffer,
    CustomizationSpecSnapshot,
    CustomizationThread,
    CustomizationThreadStatus,
    MessageAuthor,
} from '@/src/domain/customization'
import {
    asCustomizationMessageId,
    asCustomizationOfferId,
    asCustomizationThreadId,
    asSellerOrderItemId,
} from '@/src/domain/shared/id'
import type {
    CustomizationMessageId,
    CustomizationOfferId,
    CustomizationThreadId,
    SellerOrderItemId,
} from '@/src/domain/shared/id'

export function customizationStorageDrizzle(): CustomizationStorage {
    return {
        async createThread(sellerOrderItemId: SellerOrderItemId): Promise<CustomizationThreadId> {
            const [row] = await db
                .insert(customizationThreads)
                .values({status: 'open'})
                .returning({id: customizationThreads.customization_thread_id})
            await db
                .update(sellerOrderItems)
                .set({customization_thread_id: row.id})
                .where(eq(sellerOrderItems.seller_order_item_id, sellerOrderItemId as unknown as number))
            return asCustomizationThreadId(row.id)
        },

        async findThread(id: CustomizationThreadId): Promise<CustomizationThread | null> {
            const [head] = await db
                .select()
                .from(customizationThreads)
                .where(eq(customizationThreads.customization_thread_id, id as unknown as number))
            if (!head) return null

            const itemRows = await db
                .select({itemId: sellerOrderItems.seller_order_item_id})
                .from(sellerOrderItems)
                .where(eq(sellerOrderItems.customization_thread_id, head.customization_thread_id))

            const offersRows = await db
                .select()
                .from(customizationOffers)
                .where(eq(customizationOffers.thread_id, head.customization_thread_id))

            const messagesRows = await db
                .select()
                .from(customizationMessages)
                .where(eq(customizationMessages.thread_id, head.customization_thread_id))

            const offers: CustomizationOffer[] = offersRows.map((o) => ({
                id: asCustomizationOfferId(o.customization_offer_id),
                version: o.version,
                spec: o.spec_snapshot as CustomizationSpecSnapshot,
                priceDelta: o.price_delta,
                createdAt: o.created_at,
                supersededByOfferId: o.superseded_by_offer_id !== null ? asCustomizationOfferId(o.superseded_by_offer_id) : null,
            }))

            const messages: CustomizationMessage[] = messagesRows.map((m) => ({
                id: asCustomizationMessageId(m.customization_message_id),
                author: m.author as MessageAuthor,
                body: m.body,
                attachmentUrls: Array.isArray(m.attachment_urls) ? (m.attachment_urls as string[]) : [],
                createdAt: m.created_at,
            }))

            return {
                id: asCustomizationThreadId(head.customization_thread_id),
                sellerOrderItemId: itemRows[0]
                    ? asSellerOrderItemId(itemRows[0].itemId)
                    : asSellerOrderItemId(0),
                status: head.status as CustomizationThreadStatus,
                offers,
                messages,
                agreedOfferId: head.agreed_offer_id !== null ? asCustomizationOfferId(head.agreed_offer_id) : null,
            }
        },

        async findThreadByItem(itemId: SellerOrderItemId): Promise<CustomizationThread | null> {
            const [row] = await db
                .select({threadId: sellerOrderItems.customization_thread_id})
                .from(sellerOrderItems)
                .where(eq(sellerOrderItems.seller_order_item_id, itemId as unknown as number))
            if (!row?.threadId) return null
            return this.findThread(asCustomizationThreadId(row.threadId))
        },

        async appendMessage(threadId, draft): Promise<CustomizationMessageId> {
            const [row] = await db
                .insert(customizationMessages)
                .values({
                    thread_id: threadId as unknown as number,
                    author: draft.author,
                    body: draft.body,
                    attachment_urls: draft.attachmentUrls as unknown as string[],
                })
                .returning({id: customizationMessages.customization_message_id})
            return asCustomizationMessageId(row.id)
        },

        async appendOffer(threadId, draft): Promise<CustomizationOfferId> {
            const active = await db
                .select()
                .from(customizationOffers)
                .where(
                    and(
                        eq(customizationOffers.thread_id, threadId as unknown as number),
                        isNull(customizationOffers.superseded_by_offer_id),
                    ),
                )
            const nextVersion = active.reduce((max, o) => (o.version > max ? o.version : max), 0) + 1

            const [row] = await db
                .insert(customizationOffers)
                .values({
                    thread_id: threadId as unknown as number,
                    version: nextVersion,
                    price_delta: draft.priceDelta,
                    spec_snapshot: draft.spec as unknown as Record<string, unknown>,
                })
                .returning({id: customizationOffers.customization_offer_id})

            if (draft.supersededPriorActive && active.length > 0) {
                for (const prior of active) {
                    await db
                        .update(customizationOffers)
                        .set({superseded_by_offer_id: row.id})
                        .where(eq(customizationOffers.customization_offer_id, prior.customization_offer_id))
                }
            }
            return asCustomizationOfferId(row.id)
        },

        async markOfferSuperseded(offerId, bySupersededBy): Promise<void> {
            await db
                .update(customizationOffers)
                .set({superseded_by_offer_id: bySupersededBy as unknown as number})
                .where(eq(customizationOffers.customization_offer_id, offerId as unknown as number))
        },

        async markAllActiveOffersSuperseded(threadId): Promise<void> {
            const active = await db
                .select()
                .from(customizationOffers)
                .where(
                    and(
                        eq(customizationOffers.thread_id, threadId as unknown as number),
                        isNull(customizationOffers.superseded_by_offer_id),
                    ),
                )
            for (const o of active) {
                await db
                    .update(customizationOffers)
                    .set({superseded_by_offer_id: o.customization_offer_id})
                    .where(eq(customizationOffers.customization_offer_id, o.customization_offer_id))
            }
        },

        async updateThreadStatus(threadId, status, agreedOfferId): Promise<void> {
            await db
                .update(customizationThreads)
                .set({
                    status,
                    agreed_offer_id: agreedOfferId !== null ? (agreedOfferId as unknown as number) : null,
                    updated_at: new Date(),
                })
                .where(eq(customizationThreads.customization_thread_id, threadId as unknown as number))
        },

        async saveFinalSpec(params): Promise<void> {
            await db.insert(customizationFinalSpecs).values({
                thread_id: params.threadId as unknown as number,
                offer_id: params.offerId as unknown as number,
                spec_snapshot: params.spec as unknown as Record<string, unknown>,
                price_delta: params.priceDelta,
            })
        },
    }
}
