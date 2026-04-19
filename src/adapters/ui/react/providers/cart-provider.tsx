'use client'

import {createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode} from 'react'
import type {Cart, CartItem, CartTotals} from '@/src/domain/cart'
import {
    EMPTY_CART,
    addItem as addItemDomain,
    removeItem as removeItemDomain,
    updateQuantity as updateQuantityDomain,
    clear as clearDomain,
    applyPromo as applyPromoDomain,
    calcTotals,
    itemsCount as itemsCountDomain,
} from '@/src/domain/cart'
import type {ProductId} from '@/src/domain/shared/id'
import type {CartStorage} from '@/src/application/ports/cart-storage'
import {cartStorageLocal} from '@/src/adapters/storage/browser/cart-storage-local'

interface CartContextValue {
    cart: Cart
    items: CartItem[]
    totals: CartTotals
    itemsCount: number
    addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
    removeItem: (id: ProductId) => void
    updateQuantity: (id: ProductId, quantity: number) => void
    clear: () => void
    applyPromo: (code: string) => void
    setCart: (cart: Cart) => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

interface CartProviderProps {
    children: ReactNode
    storage?: CartStorage
}

export function CartProvider({children, storage}: CartProviderProps) {
    const storageRef = useRef<CartStorage>(storage ?? cartStorageLocal())
    const [cart, setCartState] = useState<Cart>(EMPTY_CART)

    useEffect(() => {
        setCartState(storageRef.current.load())
    }, [])

    useEffect(() => {
        storageRef.current.save(cart)
    }, [cart])

    const value = useMemo<CartContextValue>(() => ({
        cart,
        items: cart.items,
        totals: calcTotals(cart),
        itemsCount: itemsCountDomain(cart),
        addItem: (item, quantity = 1) => setCartState((c) => addItemDomain(c, item, quantity)),
        removeItem: (id) => setCartState((c) => removeItemDomain(c, id)),
        updateQuantity: (id, quantity) => setCartState((c) => updateQuantityDomain(c, id, quantity)),
        clear: () => setCartState((c) => clearDomain(c)),
        applyPromo: (code) => setCartState((c) => applyPromoDomain(c, code)),
        setCart: setCartState,
    }), [cart])

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error('useCart must be used within CartProvider')
    return ctx
}
