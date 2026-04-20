'use client'

import {useCallback, useContext, useRef} from 'react'
import {checkout, type CheckoutResult, EmptyCartError} from '@/src/application/use-cases/cart'
import {customerOrderGatewayHttp} from '@/src/adapters/storage/http/customer-order-gateway-http'
import {cartStorageLocal} from '@/src/adapters/storage/browser/cart-storage-local'
import {checkoutPreferencesLocal} from '@/src/adapters/storage/browser/checkout-preferences-local'
import {RootStoreContext} from '@/src/adapters/ui/react/stores/root-store-context'

export function useCheckout() {
    const rootStore = useContext(RootStoreContext)
    if (!rootStore) throw new Error('useCheckout must be used within RootStoreProvider')
    const {cartStore} = rootStore

    const depsRef = useRef({
        customerOrderGateway: customerOrderGatewayHttp(),
        cartStorage: cartStorageLocal(),
        preferences: checkoutPreferencesLocal(),
    })

    return useCallback(async (): Promise<CheckoutResult> => {
        const result = await checkout({cart: cartStore.cart}, depsRef.current)
        cartStore.setCart(result.cart)
        return result
    }, [cartStore])
}

export {EmptyCartError}
