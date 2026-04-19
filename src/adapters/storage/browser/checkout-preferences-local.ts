import type {CheckoutPreferences} from '@/src/application/ports/checkout-preferences'

const DEFAULT_ADDRESS = '123 Main St, City'
const DEFAULT_PAYMENT_METHOD = 'Credit Card'

export function checkoutPreferencesLocal(): CheckoutPreferences {
    return {
        getAddress(): string {
            if (typeof window === 'undefined') return DEFAULT_ADDRESS
            return window.localStorage.getItem('userAddress') ?? DEFAULT_ADDRESS
        },
        getPaymentMethod(): string {
            if (typeof window === 'undefined') return DEFAULT_PAYMENT_METHOD
            return window.localStorage.getItem('paymentMethod') ?? DEFAULT_PAYMENT_METHOD
        },
    }
}
