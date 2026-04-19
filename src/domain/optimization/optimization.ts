export interface OrderIngredientDemand {
    name: string
    amount: number
    unit: string
}

export interface OrderedItem {
    name: string
    quantity: number
    ingredients: OrderIngredientDemand[]
}

export interface OrderSnapshot {
    status: string | null
    items: OrderedItem[]
}

export interface IngredientSnapshot {
    ingredientId: number
    name: string
    unit: string
    stock: number
    purchaseQty: number
    purchasePrice: number
}

export interface PurchaseItem {
    name: string
    unit: string
    needed: number
    stock: number
    packagesToBuy: number
    purchaseQty: number
    cost: number
}

export interface MaxProfitProductItem {
    productId: number
    name: string
    orderedQty: number
    fulfillQty: number
    price: number
    revenue: number
    limitingIngredient?: string
}

export function aggregateNeeded(activeOrders: OrderSnapshot[]): Record<string, number> {
    const needed: Record<string, number> = {}
    for (const order of activeOrders) {
        for (const item of order.items) {
            const qty = item.quantity || 1
            for (const ing of item.ingredients) {
                if (!ing.name) continue
                needed[ing.name] = (needed[ing.name] || 0) + ing.amount * qty
            }
        }
    }
    return needed
}

export function packagesFor(shortfall: number, purchaseQty: number): number {
    if (purchaseQty <= 0 || shortfall <= 0) return 0
    return Math.ceil(shortfall / purchaseQty)
}

export function buildPurchaseList(
    ingredients: IngredientSnapshot[],
    needed: Record<string, number>,
): PurchaseItem[] {
    return ingredients.map((ing) => {
        const n = needed[ing.name] || 0
        const shortfall = Math.max(0, n - ing.stock)
        const packages = packagesFor(shortfall, ing.purchaseQty)
        return {
            name: ing.name,
            unit: ing.unit,
            needed: n,
            stock: ing.stock,
            packagesToBuy: packages,
            purchaseQty: ing.purchaseQty,
            cost: packages * ing.purchasePrice,
        }
    })
}

export function sumCost(items: PurchaseItem[]): number {
    return items.reduce((acc, it) => acc + it.cost, 0)
}

export function hasMissingPrices(ingredients: IngredientSnapshot[]): boolean {
    return ingredients.some((i) => i.purchasePrice === 0 && i.purchaseQty > 0)
}

export function ingredientPricePerUnit(purchasePrice: number, purchaseQty: number): number {
    if (purchaseQty <= 0) return 0
    return purchasePrice / purchaseQty
}

export function csvRow(...cells: Array<string | number>): string {
    return cells.map((c) => String(c)).join(';')
}
