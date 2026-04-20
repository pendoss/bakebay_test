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

export function cartLineId(item: Omit<CartItem, 'quantity'>): string {
    const optionKey = (item.optionSelections ?? [])
        .map((o) => o.valueId)
        .sort((a, b) => a - b)
        .join(',')
    const noteKey = (item.customerNote ?? '').trim()
    return `${item.productId as unknown as number}|${optionKey}|${noteKey}`
}

function sameSelection(a: CartItem, b: Omit<CartItem, 'quantity'>): boolean {
    return cartLineId(a) === cartLineId(b)
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

export function removeItem(cart: Cart, lineId: string): Cart {
    return {...cart, items: cart.items.filter((i) => cartLineId(i) !== lineId)}
}

export function updateQuantity(cart: Cart, lineId: string, quantity: number): Cart {
    if (quantity < 1) return cart
    return {
        ...cart,
        items: cart.items.map((i) => (cartLineId(i) === lineId ? {...i, quantity} : i)),
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
