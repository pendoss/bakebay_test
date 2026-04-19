import type {Cart, CartItem} from '@/src/domain/cart'
import {EMPTY_CART} from '@/src/domain/cart'
import type {CartStorage} from '@/src/application/ports/cart-storage'
import {asProductId} from '@/src/domain/shared/id'

const STORAGE_KEY = 'cart'

interface LegacyCartItem {
    id: number
    name: string
    price: number
    image: string
    quantity: number
    seller: string
}

function parseStored(raw: string): Cart {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
        return {items: parsed.map(fromLegacy), promoCode: null}
    }
    if (parsed && typeof parsed === 'object' && 'items' in parsed) {
        const candidate = parsed as { items: unknown; promoCode?: string | null }
        if (Array.isArray(candidate.items)) {
            return {
                items: candidate.items.map(fromLegacy),
                promoCode: typeof candidate.promoCode === 'string' ? candidate.promoCode : null,
            }
        }
    }
    return EMPTY_CART
}

function fromLegacy(raw: unknown): CartItem {
    const r = raw as Partial<LegacyCartItem> & Partial<CartItem>
    const id = (r as LegacyCartItem).id ?? (r as CartItem).productId
    return {
        productId: asProductId(Number(id)),
        name: String(r.name ?? ''),
        price: Number(r.price ?? 0),
        image: String(r.image ?? ''),
        seller: String(r.seller ?? ''),
        quantity: Number(r.quantity ?? 1),
    }
}

export function cartStorageLocal(): CartStorage {
    return {
        load(): Cart {
            if (typeof window === 'undefined') return EMPTY_CART
            try {
                const raw = window.localStorage.getItem(STORAGE_KEY)
                return raw ? parseStored(raw) : EMPTY_CART
            } catch {
                return EMPTY_CART
            }
        },
        save(cart: Cart): void {
            if (typeof window === 'undefined') return
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
            } catch {
                // Storage full or unavailable — swallow.
            }
        },
    }
}
