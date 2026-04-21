import {isEmpty} from '@/src/domain/cart'
import type {Cart} from '@/src/domain/cart'
import type {CustomerOrderId, SellerOrderId} from '@/src/domain/shared/id'
import type {CustomerOrderGateway} from '@/src/application/ports/customer-order-gateway'
import type {CartStorage} from '@/src/application/ports/cart-storage'
import type {CheckoutPreferences} from '@/src/application/ports/checkout-preferences'

export class EmptyCartError extends Error {
    constructor() {
        super('Cart is empty')
        this.name = 'EmptyCartError'
    }
}

export interface CheckoutInput {
    cart: Cart
}

export interface CheckoutDeps {
    customerOrderGateway: CustomerOrderGateway
    cartStorage: CartStorage
    preferences: CheckoutPreferences
}

export interface CheckoutResult {
    customerOrderId: CustomerOrderId
    sellerOrderIds: ReadonlyArray<SellerOrderId>
    cart: Cart
}

export async function checkout(input: CheckoutInput, deps: CheckoutDeps): Promise<CheckoutResult> {
    if (isEmpty(input.cart)) {
        throw new EmptyCartError()
    }

    const result = await deps.customerOrderGateway.placeCustomerOrder({
        address: deps.preferences.getAddress(),
        paymentMethod: deps.preferences.getPaymentMethod(),
        items: input.cart.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            optionValueIds: i.optionSelections?.map((o) => o.valueId),
            customerNote: i.customerNote,
            optionSelectionsSummary: i.optionSelections?.map((o) => ({groupName: o.groupName, label: o.label})),
            customizationDelta: i.optionSelections?.reduce((s, o) => s + o.priceDelta, 0),
        })),
    })

    const empty: Cart = {items: [], promoCode: null}
    deps.cartStorage.save(empty)

    return {
        customerOrderId: result.customerOrderId,
        sellerOrderIds: result.sellerOrderIds,
        cart: empty,
    }
}
