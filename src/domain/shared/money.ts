export type Currency = 'RUB'

export interface Money {
    amount: number
    currency: Currency
}

export function money(amount: number, currency: Currency = 'RUB'): Money {
    return {amount, currency}
}

export function addMoney(a: Money, b: Money): Money {
    assertSameCurrency(a, b)
    return {amount: a.amount + b.amount, currency: a.currency}
}

export function subtractMoney(a: Money, b: Money): Money {
    assertSameCurrency(a, b)
    return {amount: a.amount - b.amount, currency: a.currency}
}

export function multiplyMoney(a: Money, factor: number): Money {
    return {amount: a.amount * factor, currency: a.currency}
}

export function isZero(a: Money): boolean {
    return a.amount === 0
}

function assertSameCurrency(a: Money, b: Money): void {
    if (a.currency !== b.currency) {
        throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`)
    }
}
