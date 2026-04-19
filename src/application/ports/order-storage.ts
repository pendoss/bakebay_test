import type {Order, OrderStatus} from '@/src/domain/order'
import type {OrderId, SellerId, UserId} from '@/src/domain/shared/id'

export interface OrderListFilters {
    sellerId?: SellerId | null
    userId?: UserId | null
    status?: OrderStatus | null
}

export interface OrderDraftItem {
    productId: number
    quantity: number
}

export interface OrderDraft {
    userId: UserId | null
    address: string
    paymentMethod: string
    items: OrderDraftItem[]
}

export interface OrderStorage {
    findById(id: OrderId): Promise<Order | null>

    listIds(filters: OrderListFilters): Promise<OrderId[]>

    listByIds(ids: OrderId[]): Promise<Order[]>

    create(draft: OrderDraft, totalPrice: number): Promise<OrderId>

    updateStatus(id: OrderId, status: OrderStatus): Promise<boolean>
}
