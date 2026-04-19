import type {OrderId, OrderItemId, ProductId, UserId} from '@/src/domain/shared/id'

export type OrderStatus =
    | 'ordering'
    | 'processing'
    | 'payed'
    | 'processed'
    | 'in_progress'
    | 'delivering'
    | 'delivered'

export interface OrderItemIngredient {
    name: string
    amount: number
    unit: string
}

export interface OrderItem {
    id: OrderItemId
    productId: ProductId | null
    name: string
    quantity: number
    ingredients: OrderItemIngredient[]
}

export interface Order {
    id: OrderId
    userId: UserId | null
    status: OrderStatus
    totalPrice: number
    address: string
    paymentMethod: string
    date: Date
    items: OrderItem[]
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    ordering: ['processing'],
    processing: ['payed'],
    payed: ['processed'],
    processed: ['in_progress'],
    in_progress: ['delivering'],
    delivering: ['delivered'],
    delivered: [],
}

export class InvalidOrderStatusTransitionError extends Error {
    constructor(from: OrderStatus, to: OrderStatus) {
        super(`Invalid order status transition: ${from} → ${to}`)
        this.name = 'InvalidOrderStatusTransitionError'
    }
}

export class OrderNotFoundError extends Error {
    constructor(id: OrderId) {
        super(`Order ${id} not found`)
        this.name = 'OrderNotFoundError'
    }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
    if (!canTransition(from, to)) throw new InvalidOrderStatusTransitionError(from, to)
}

export function calcOrderTotal(items: OrderItem[], unitPrices: Record<number, number>): number {
    return items.reduce((sum, item) => {
        const pid = item.productId as unknown as number | null
        const price = pid !== null ? (unitPrices[pid] ?? 0) : 0
        return sum + price * item.quantity
    }, 0)
}

export function aggregateIngredients(items: OrderItem[]): OrderItemIngredient[] {
    const map = new Map<string, OrderItemIngredient>()
    for (const item of items) {
        for (const ing of item.ingredients) {
            const key = `${ing.name}|${ing.unit}`
            const prev = map.get(key)
            const scaled = ing.amount * item.quantity
            if (prev) prev.amount += scaled
            else map.set(key, {name: ing.name, unit: ing.unit, amount: scaled})
        }
    }
    return Array.from(map.values())
}
