import type {
    CustomerOrderId,
    SellerId,
    SellerOrderId,
    SellerOrderItemId,
    UserId,
} from '@/src/domain/shared/id'
import type {CustomerOrder, CustomerOrderDerivedStatus} from '@/src/domain/customer-order'
import type {RefundState, SellerOrder, StockOverall} from '@/src/domain/seller-order'

export interface CustomerOrderDraft {
    readonly userId: UserId
    readonly address: string
    readonly paymentMethod: string
}

export interface SellerOrderDraft {
    readonly sellerId: SellerId
    readonly items: ReadonlyArray<SellerOrderItemDraft>
    readonly commissionRate: number
    readonly shipping: number
}

export interface SellerOrderItemDraft {
    readonly productId: number
    readonly quantity: number
    readonly unitPrice: number
    readonly customizationDelta?: number
    readonly needsCustomization?: boolean
    readonly optionValueIds?: ReadonlyArray<number>
    readonly customerNote?: string
    readonly optionSelectionsSummary?: ReadonlyArray<{ groupName: string; label: string }>
}

export interface CustomizableItemContext {
    readonly itemId: SellerOrderItemId
    readonly optionSelectionsSummary: ReadonlyArray<{ groupName: string; label: string }>
    readonly customerNote: string
}

export interface CreatedSellerOrder {
    readonly sellerOrderId: SellerOrderId
    readonly customizableItemIds: ReadonlyArray<SellerOrderItemId>
    readonly customizableItemContexts: ReadonlyArray<CustomizableItemContext>
}

export interface CreateCustomerOrderResult {
    readonly customerOrderId: CustomerOrderId
    readonly sellerOrderIds: ReadonlyArray<SellerOrderId>
    readonly createdSellerOrders: ReadonlyArray<CreatedSellerOrder>
}

export interface CustomerOrderStorage {
    findById(id: CustomerOrderId): Promise<CustomerOrder | null>

    listByUser(userId: UserId): Promise<CustomerOrder[]>

    create(
        customerDraft: CustomerOrderDraft,
        sellerDrafts: ReadonlyArray<SellerOrderDraft>,
    ): Promise<CreateCustomerOrderResult>

    updateDerivedStatus(id: CustomerOrderId, status: CustomerOrderDerivedStatus): Promise<void>
}

export interface SellerOrderStorage {
    findById(id: SellerOrderId): Promise<SellerOrder | null>

    listByCustomerOrder(id: CustomerOrderId): Promise<SellerOrder[]>

    listBySeller(sellerId: SellerId): Promise<SellerOrder[]>

    updateStatus(id: SellerOrderId, status: SellerOrder['status'], cancelReason?: string): Promise<void>

    updateStockCheck(id: SellerOrderId, stockCheck: StockOverall): Promise<void>

    updateRefund(id: SellerOrderId, state: RefundState, reason: string | null): Promise<void>
}
