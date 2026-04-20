'use client'

import {makeAutoObservable} from 'mobx'
import {useContext} from 'react'
import type {AddItemInput, Cart, CartItem, CartTotals, UpdateItemPatch} from '@/src/domain/cart'
import {
    addItem as addItemDomain,
    applyPromo as applyPromoDomain,
    calcTotals,
    clear as clearDomain,
    EMPTY_CART,
    itemsCount as itemsCountDomain,
    removeItem as removeItemDomain,
    updateItem as updateItemDomain,
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

    addItem(item: AddItemInput, quantity = 1): void {
        this.cart = addItemDomain(this.cart, item, quantity)
        this.storage.save(this.cart)
    }

    removeItem(clientId: string): void {
        this.cart = removeItemDomain(this.cart, clientId)
        this.storage.save(this.cart)
    }

    updateQuantity(clientId: string, quantity: number): void {
        this.cart = updateQuantityDomain(this.cart, clientId, quantity)
        this.storage.save(this.cart)
    }

    updateItem(clientId: string, patch: UpdateItemPatch): void {
        this.cart = updateItemDomain(this.cart, clientId, patch)
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
        addItem: (item: AddItemInput, quantity?: number) => store.addItem(item, quantity),
        removeItem: (clientId: string) => store.removeItem(clientId),
        updateQuantity: (clientId: string, quantity: number) => store.updateQuantity(clientId, quantity),
        updateItem: (clientId: string, patch: UpdateItemPatch) => store.updateItem(clientId, patch),
        clear: () => store.clear(),
        applyPromo: (code: string) => store.applyPromo(code),
        setCart: (cart: Cart) => store.setCart(cart),
    }
}
