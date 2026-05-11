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

function randomClientId(): string {
    const rnd =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2, 10)
    return `${Date.now()}-${rnd}`
}

function fromLegacy(raw: unknown): CartItem {
    const r = raw as Partial<LegacyCartItem> & Partial<CartItem>
    const id = (r as LegacyCartItem).id ?? (r as CartItem).productId
    return {
        clientId: typeof r.clientId === 'string' && r.clientId.length > 0 ? r.clientId : randomClientId(),
        productId: asProductId(Number(id)),
        name: String(r.name ?? ''),
        price: Number(r.price ?? 0),
        image: String(r.image ?? ''),
        seller: String(r.seller ?? ''),
        quantity: Number(r.quantity ?? 1),
        optionSelections: Array.isArray(r.optionSelections) ? r.optionSelections : undefined,
        customerNote: typeof r.customerNote === 'string' ? r.customerNote : undefined,
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
