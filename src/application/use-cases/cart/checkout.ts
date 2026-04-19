import {isEmpty} from '@/src/domain/cart'
import type {Cart} from '@/src/domain/cart'
import type {OrderId} from '@/src/domain/shared/id'
import type {OrderGateway} from '@/src/application/ports/order-gateway'
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
    orderGateway: OrderGateway
    cartStorage: CartStorage
    preferences: CheckoutPreferences
}

export interface CheckoutResult {
    orderId: OrderId
    cart: Cart
}

export async function checkout(input: CheckoutInput, deps: CheckoutDeps): Promise<CheckoutResult> {
    if (isEmpty(input.cart)) {
        throw new EmptyCartError()
    }

    const {orderId} = await deps.orderGateway.placeOrder({
        address: deps.preferences.getAddress(),
        paymentMethod: deps.preferences.getPaymentMethod(),
        items: input.cart.items.map((i) => ({productId: i.productId, quantity: i.quantity})),
    })

    const empty: Cart = {items: [], promoCode: null}
    deps.cartStorage.save(empty)

    return {orderId, cart: empty}
}
