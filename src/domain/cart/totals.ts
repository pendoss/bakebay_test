import type {Cart} from './cart'

export interface CartTotals {
    subtotal: number
    discount: number
    shipping: number
    tax: number
    total: number
}

const PROMO_DISCOUNT_RATE = 0.1
const FREE_SHIPPING_THRESHOLD = 50
const SHIPPING_FEE = 5.99
const TAX_RATE = 0.08

export function calcSubtotal(cart: Cart): number {
    return cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

export function calcTotals(cart: Cart): CartTotals {
    const subtotal = calcSubtotal(cart)
    const discount = cart.promoCode ? subtotal * PROMO_DISCOUNT_RATE : 0
    const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
    const tax = (subtotal - discount) * TAX_RATE
    const total = subtotal - discount + shipping + tax
    return {subtotal, discount, shipping, tax, total}
}
