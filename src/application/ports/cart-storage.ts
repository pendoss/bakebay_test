import type {Cart} from '@/src/domain/cart'

export interface CartStorage {
    load(): Cart

    save(cart: Cart): void
}
