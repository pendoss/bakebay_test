import type {IngredientId, ProductId} from '@/src/domain/shared/id'

export type StockStatus = 'ok' | 'low' | 'out'

export interface Ingredient {
    id: IngredientId
    productId: ProductId | null
    name: string
    unit: string
    amount: number
    stock: number
    alert: number
    status: StockStatus
    purchaseQty: number
    purchasePrice: number
}

export interface StockDeduction {
    name: string
    unit: string
    amount: number
}

export class IngredientNotFoundError extends Error {
    constructor(name: string) {
        super(`Ingredient ${name} not found`)
        this.name = 'IngredientNotFoundError'
    }
}

export function computeStatus(stock: number, alert: number): StockStatus {
    if (stock <= 0) return 'out'
    if (stock <= alert) return 'low'
    return 'ok'
}

export function applyDeduction(ingredient: Ingredient, amount: number): Ingredient {
    const nextStock = ingredient.stock - amount
    return {
        ...ingredient,
        stock: nextStock,
        status: computeStatus(nextStock, ingredient.alert),
    }
}

export function applyRestock(ingredient: Ingredient, amount: number, unit: string, alert: number): Ingredient {
    const nextStock = ingredient.stock + amount
    return {
        ...ingredient,
        stock: nextStock,
        unit,
        alert,
        status: computeStatus(nextStock, alert),
    }
}

export function isLowOrOut(ingredient: Ingredient): boolean {
    return ingredient.status !== 'ok'
}

export function shortageAmount(ingredient: Ingredient, required: number): number {
    return Math.max(0, required - ingredient.stock)
}
