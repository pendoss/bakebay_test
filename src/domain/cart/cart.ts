import type {ProductId} from '@/src/domain/shared/id'

export interface CartItemOptionSelection {
    groupId: number
    groupName: string
    valueId: number
    label: string
    priceDelta: number
}

export interface CartItem {
    /**
     * Стабильный идентификатор строки — назначается при addItem и
     * переживает редактирование опций/комментария. Используется как
     * React-key в списке корзины, чтобы правки не вызывали remount.
     */
    clientId: string
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

export function cartLineId(item: Pick<CartItem, 'productId' | 'optionSelections' | 'customerNote'>): string {
    const optionKey = (item.optionSelections ?? [])
        .map((o) => o.valueId)
        .sort((a, b) => a - b)
        .join(',')
    const noteKey = (item.customerNote ?? '').trim()
    return `${item.productId as unknown as number}|${optionKey}|${noteKey}`
}

function generateClientId(): string {
    const randomPart =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2, 10)
    return `${Date.now()}-${randomPart}`
}

function sameSelection(a: CartItem, b: Omit<CartItem, 'quantity' | 'clientId'>): boolean {
    return cartLineId(a) === cartLineId(b)
}

export type AddItemInput = Omit<CartItem, 'quantity' | 'clientId'> & {clientId?: string}

export function addItem(cart: Cart, item: AddItemInput, quantity = 1): Cart {
    const existing = cart.items.find((i) => sameSelection(i, item))
    if (existing) {
        return {
            ...cart,
            items: cart.items.map((i) => (i === existing ? {...i, quantity: i.quantity + quantity} : i)),
        }
    }
    const created: CartItem = {...item, clientId: item.clientId ?? generateClientId(), quantity}
    return {...cart, items: [...cart.items, created]}
}

export function removeItem(cart: Cart, clientId: string): Cart {
    return {...cart, items: cart.items.filter((i) => i.clientId !== clientId)}
}

export function updateQuantity(cart: Cart, clientId: string, quantity: number): Cart {
    if (quantity < 1) return cart
    return {
        ...cart,
        items: cart.items.map((i) => (i.clientId === clientId ? {...i, quantity} : i)),
    }
}

export type UpdateItemPatch = Partial<Pick<CartItem, 'price' | 'optionSelections' | 'customerNote'>>

export function updateItem(cart: Cart, clientId: string, patch: UpdateItemPatch): Cart {
    return {
        ...cart,
        items: cart.items.map((i) => (i.clientId === clientId ? {...i, ...patch} : i)),
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
