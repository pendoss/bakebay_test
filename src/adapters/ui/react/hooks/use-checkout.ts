'use client'

import {useCallback, useRef} from 'react'
import {useCart} from '@/src/adapters/ui/react/providers/cart-provider'
import {checkout, EmptyCartError, type CheckoutResult} from '@/src/application/use-cases/cart'
import {orderGatewayHttp} from '@/src/adapters/storage/http/order-gateway-http'
import {cartStorageLocal} from '@/src/adapters/storage/browser/cart-storage-local'
import {checkoutPreferencesLocal} from '@/src/adapters/storage/browser/checkout-preferences-local'

export function useCheckout() {
    const {cart, setCart} = useCart()
    const depsRef = useRef({
        orderGateway: orderGatewayHttp(),
        cartStorage: cartStorageLocal(),
        preferences: checkoutPreferencesLocal(),
    })

    return useCallback(async (): Promise<CheckoutResult> => {
        const result = await checkout({cart}, depsRef.current)
        setCart(result.cart)
        return result
    }, [cart, setCart])
}

export {EmptyCartError}
