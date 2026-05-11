export interface Ingredient {
    ingredient_id: number
    name: string
    amount: string
    stock: number
    unit: string
    status: string
    alert: number
    purchase_qty: number
    purchase_price: number
    reserved: number
}

export interface OrderItem {
    name: string
    quantity: number
    ingredients: Ingredient[]
}

export interface Order {
    id: string
    status: string
    items: OrderItem[]
    customer: string
}

export interface IngredientDetail {
    amounts: number[]
    orders: Set<string>
    unit: string
}

export type AllIngredientsType = Record<string, IngredientDetail>
export type CheckedIngredientsType = Record<string, boolean>
