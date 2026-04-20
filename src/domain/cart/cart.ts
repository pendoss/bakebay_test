import type {ProductId} from '@/src/domain/shared/id'

export interface CartItemOptionSelection {
    groupId: number
    groupName: string
    valueId: number
    label: string
    priceDelta: number
}

export interface CartItem {
    productId: ProductId
    name: string
    price: number
    image: string
    seller: string
    quantity: number
    optionSelections?: CartItemOptionSelection[]
    customerNote?: string
}

export interface Cart {
    items: CartItem[]
    promoCode: string | null
}

export const EMPTY_CART: Cart = {items: [], promoCode: null}

function sameSelection(a: CartItem, b: Omit<CartItem, 'quantity'>): boolean {
    if (a.productId !== b.productId) return false
    const aKeys = (a.optionSelections ?? []).map((o) => o.valueId).sort().join(',')
    const bKeys = (b.optionSelections ?? []).map((o) => o.valueId).sort().join(',')
    if (aKeys !== bKeys) return false
    return (a.customerNote ?? '') === (b.customerNote ?? '')
}

export function addItem(cart: Cart, item: Omit<CartItem, 'quantity'>, quantity = 1): Cart {
    const existing = cart.items.find((i) => sameSelection(i, item))
    if (existing) {
        return {
            ...cart,
            items: cart.items.map((i) => (i === existing ? {...i, quantity: i.quantity + quantity} : i)),
        }
    }
    return {...cart, items: [...cart.items, {...item, quantity}]}
}

export function removeItem(cart: Cart, productId: ProductId): Cart {
    return {...cart, items: cart.items.filter((i) => i.productId !== productId)}
}

export function updateQuantity(cart: Cart, productId: ProductId, quantity: number): Cart {
    if (quantity < 1) return cart
    return {
        ...cart,
        items: cart.items.map((i) => (i.productId === productId ? {...i, quantity} : i)),
    }
}

export function clear(_cart: Cart): Cart {
    return {items: [], promoCode: null}
}

export function applyPromo(cart: Cart, code: string): Cart {
    return {...cart, promoCode: code.trim() || null}
}

export function clearPromo(cart: Cart): Cart {
    return {...cart, promoCode: null}
}

export function itemsCount(cart: Cart): number {
    return cart.items.reduce((acc, i) => acc + i.quantity, 0)
}

export function isEmpty(cart: Cart): boolean {
    return cart.items.length === 0
}
