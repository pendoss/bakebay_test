import type {CustomerOrderId, ProductId, SellerOrderId} from '@/src/domain/shared/id'

export interface PlaceCustomerOrderLine {
    productId: ProductId
    quantity: number
    optionValueIds?: number[]
    customerNote?: string
    optionSelectionsSummary?: Array<{ groupName: string; label: string }>
    customizationDelta?: number
}

export interface PlaceCustomerOrderRequest {
    address: string
    paymentMethod: string
    items: PlaceCustomerOrderLine[]
}

export interface PlaceCustomerOrderResult {
    customerOrderId: CustomerOrderId
    sellerOrderIds: ReadonlyArray<SellerOrderId>
}

export interface CustomerOrderGateway {
    placeCustomerOrder(request: PlaceCustomerOrderRequest): Promise<PlaceCustomerOrderResult>
}
