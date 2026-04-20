'use client'

import {makeAutoObservable} from 'mobx'
import {useContext} from 'react'
import type {Cart, CartItem, CartTotals} from '@/src/domain/cart'
import {
    addItem as addItemDomain,
    applyPromo as applyPromoDomain,
    calcTotals,
    clear as clearDomain,
    EMPTY_CART,
    itemsCount as itemsCountDomain,
    removeItem as removeItemDomain,
    updateQuantity as updateQuantityDomain,
} from '@/src/domain/cart'
import type {CartStorage} from '@/src/application/ports/cart-storage'
import {RootStoreContext} from './root-store-context'

export class CartStore {
    cart: Cart = EMPTY_CART

    constructor(private readonly storage: CartStorage) {
        makeAutoObservable(this)
    }

    get items(): CartItem[] {
        return this.cart.items
    }

    get totals(): CartTotals {
        return calcTotals(this.cart)
    }

    get itemsCount(): number {
        return itemsCountDomain(this.cart)
    }

    init(): void {
        this.cart = this.storage.load()
    }

    addItem(item: Omit<CartItem, 'quantity'>, quantity = 1): void {
        this.cart = addItemDomain(this.cart, item, quantity)
        this.storage.save(this.cart)
    }

    removeItem(lineId: string): void {
        this.cart = removeItemDomain(this.cart, lineId)
        this.storage.save(this.cart)
    }

    updateQuantity(lineId: string, quantity: number): void {
        this.cart = updateQuantityDomain(this.cart, lineId, quantity)
        this.storage.save(this.cart)
    }

    clear(): void {
        this.cart = clearDomain(this.cart)
        this.storage.save(this.cart)
    }

    applyPromo(code: string): void {
        this.cart = applyPromoDomain(this.cart, code)
        this.storage.save(this.cart)
    }

    setCart(cart: Cart): void {
        this.cart = cart
        this.storage.save(cart)
    }
}

function useCartStore(): CartStore {
    const store = useContext(RootStoreContext)
    if (!store) throw new Error('useCartStore must be used within RootStoreProvider')
    return store.cartStore
}

export function useCartItems(): CartItem[] {
    return useCartStore().items
}

export function useCartTotals(): CartTotals {
    return useCartStore().totals
}

export function useCartCount(): number {
    return useCartStore().itemsCount
}

export function useCartRaw(): Cart {
    return useCartStore().cart
}

export function useCartActions() {
    const store = useCartStore()
    return {
        addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => store.addItem(item, quantity),
        removeItem: (lineId: string) => store.removeItem(lineId),
        updateQuantity: (lineId: string, quantity: number) => store.updateQuantity(lineId, quantity),
        clear: () => store.clear(),
        applyPromo: (code: string) => store.applyPromo(code),
        setCart: (cart: Cart) => store.setCart(cart),
    }
}
