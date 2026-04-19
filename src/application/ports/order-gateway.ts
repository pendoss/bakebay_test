import type {ProductId, OrderId} from '@/src/domain/shared/id'

export interface PlaceOrderRequest {
    address: string
    paymentMethod: string
    items: Array<{ productId: ProductId; quantity: number }>
}

export interface PlaceOrderResult {
    orderId: OrderId
}

export interface OrderGateway {
    placeOrder(request: PlaceOrderRequest): Promise<PlaceOrderResult>
}
