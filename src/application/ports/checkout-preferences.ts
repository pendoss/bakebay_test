export interface CheckoutPreferences {
    getAddress(): string

    getPaymentMethod(): string
}
