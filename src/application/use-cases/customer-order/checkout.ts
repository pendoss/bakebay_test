import type {ProductId, UserId} from '@/src/domain/shared/id'
import type {
    CreateCustomerOrderResult,
    CustomerOrderStorage,
    SellerOrderDraft,
    SellerOrderItemDraft,
} from '@/src/application/ports/customer-order-storage'
import type {ProductLookup} from '@/src/application/ports/product-lookup'
import type {SellerCommissionLookup} from '@/src/application/ports/seller-commission-lookup'
import type {CustomizationStorage} from '@/src/application/ports/customization-storage'

export interface CheckoutLineInput {
    readonly productId: ProductId
    readonly quantity: number
    readonly optionValueIds?: ReadonlyArray<number>
    readonly customerNote?: string
    readonly optionSelectionsSummary?: ReadonlyArray<{ groupName: string; label: string }>
    readonly customizationDelta?: number
}

export interface CheckoutInput {
    readonly userId: UserId
    readonly address: string
    readonly paymentMethod: string
    readonly lines: ReadonlyArray<CheckoutLineInput>
    readonly shippingPerSeller?: number
}

export interface CheckoutDeps {
    customerOrderStorage: CustomerOrderStorage
    productLookup: ProductLookup
    commissionLookup: SellerCommissionLookup
    customizationStorage?: CustomizationStorage
}

export class EmptyCheckoutError extends Error {
    constructor() {
        super('Checkout requires at least one line')
        this.name = 'EmptyCheckoutError'
    }
}

export class UnknownProductError extends Error {
    constructor(id: ProductId) {
        super(`Product ${id} not found during checkout`)
        this.name = 'UnknownProductError'
    }
}

export async function checkout(
    input: CheckoutInput,
    deps: CheckoutDeps,
): Promise<CreateCustomerOrderResult> {
    if (input.lines.length === 0) throw new EmptyCheckoutError()

    const productIds = Array.from(new Set(input.lines.map((l) => l.productId)))
    const products = await deps.productLookup.getMany(productIds)
    const productById = new Map(products.map((p) => [p.productId, p]))

    const linesBySeller = new Map<number, SellerOrderItemDraft[]>()
    for (const line of input.lines) {
        const product = productById.get(line.productId)
        if (!product) throw new UnknownProductError(line.productId)
        const sellerKey = product.sellerId as unknown as number
        const items = linesBySeller.get(sellerKey) ?? []
        items.push({
            productId: product.productId as unknown as number,
            quantity: line.quantity,
            unitPrice: product.price,
            customizationDelta: line.customizationDelta ?? 0,
            needsCustomization: product.isCustomizable,
            optionValueIds: line.optionValueIds,
            customerNote: line.customerNote,
            optionSelectionsSummary: line.optionSelectionsSummary,
        })
        linesBySeller.set(sellerKey, items)
    }

    const sellerDrafts: SellerOrderDraft[] = []
    for (const [sellerKey, items] of linesBySeller.entries()) {
        const sellerId = sellerKey as unknown as Parameters<SellerCommissionLookup['getRate']>[0]
        const commissionRate = await deps.commissionLookup.getRate(sellerId)
        sellerDrafts.push({
            sellerId,
            items,
            commissionRate,
            shipping: input.shippingPerSeller ?? 0,
        })
    }

    const result = await deps.customerOrderStorage.create(
        {userId: input.userId, address: input.address, paymentMethod: input.paymentMethod},
        sellerDrafts,
    )

    if (deps.customizationStorage) {
        for (const created of result.createdSellerOrders) {
            for (const ctx of created.customizableItemContexts) {
                const threadId = await deps.customizationStorage.createThread(ctx.itemId)
                const parts: string[] = []
                if (ctx.optionSelectionsSummary.length > 0) {
                    parts.push(
                        'Параметры: ' +
                        ctx.optionSelectionsSummary.map((s) => `${s.groupName} — ${s.label}`).join('; '),
                    )
                }
                if (ctx.customerNote.trim().length > 0) {
                    parts.push(`Комментарий: ${ctx.customerNote.trim()}`)
                }
                if (parts.length > 0) {
                    await deps.customizationStorage.appendMessage(threadId, {
                        author: 'customer',
                        body: parts.join('\n'),
                        attachmentUrls: [],
                    })
                }
            }
        }
    }

    return result
}
