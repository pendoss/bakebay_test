import type {OrderGateway, PlaceOrderRequest, PlaceOrderResult} from '@/src/application/ports/order-gateway'
import {asOrderId} from '@/src/domain/shared/id'

export function orderGatewayHttp(): OrderGateway {
    return {
        async placeOrder(request: PlaceOrderRequest): Promise<PlaceOrderResult> {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    address: request.address,
                    payment_method: request.paymentMethod,
                    items: request.items.map((i) => ({
                        product_id: i.productId,
                        quantity: i.quantity,
                    })),
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})) as { error?: string }
                throw new Error(errorData.error ?? 'Failed to create order')
            }

            const data = await response.json() as { order_id: number }
            return {orderId: asOrderId(data.order_id)}
        },
    }
}
