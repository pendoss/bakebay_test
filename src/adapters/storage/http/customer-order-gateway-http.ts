import type {
    CustomerOrderGateway,
    PlaceCustomerOrderRequest,
    PlaceCustomerOrderResult,
} from '@/src/application/ports/customer-order-gateway'
import {asCustomerOrderId, asSellerOrderId} from '@/src/domain/shared/id'

export function customerOrderGatewayHttp(): CustomerOrderGateway {
    return {
        async placeCustomerOrder(request: PlaceCustomerOrderRequest): Promise<PlaceCustomerOrderResult> {
            const response = await fetch('/api/customer-orders', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    address: request.address,
                    paymentMethod: request.paymentMethod,
                    lines: request.items.map((i) => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        optionValueIds: i.optionValueIds,
                        customerNote: i.customerNote,
                        optionSelectionsSummary: i.optionSelectionsSummary,
                        customizationDelta: i.customizationDelta,
                    })),
                }),
            })
            if (!response.ok) {
                const err = (await response.json().catch(() => ({}))) as { error?: string }
                throw new Error(err.error ?? 'Failed to place customer order')
            }
            const data = (await response.json()) as { customerOrderId: number; sellerOrderIds: number[] }
            return {
                customerOrderId: asCustomerOrderId(data.customerOrderId),
                sellerOrderIds: data.sellerOrderIds.map((id) => asSellerOrderId(id)),
            }
        },
    }
}
