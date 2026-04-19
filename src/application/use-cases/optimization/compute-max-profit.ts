import type {
    IngredientSnapshot,
    OrderSnapshot,
    MaxProfitProductItem,
} from '@/src/domain/optimization'
import type {LpSolver, LpModel} from '@/src/application/ports/lp-solver'

export interface MaxProfitResult {
    maxRevenue: number
    items: MaxProfitProductItem[]
    feasible: boolean
}

export interface SellerProductPrice {
    productId: number
    name: string
    price: number
}

export interface ComputeMaxProfitInput {
    ingredients: IngredientSnapshot[]
    activeOrders: OrderSnapshot[]
    sellerProducts: SellerProductPrice[]
}

export interface ComputeMaxProfitDeps {
    solver: LpSolver
}

interface ProductData {
    qty: number
    ingredients: Array<{ name: string; amountPerUnit: number }>
}

export function computeMaxProfit(
    input: ComputeMaxProfitInput,
    deps: ComputeMaxProfitDeps,
): MaxProfitResult {
    if (input.activeOrders.length === 0) return {maxRevenue: 0, items: [], feasible: true}

    const priceByName = new Map<string, { price: number; productId: number }>()
    for (const p of input.sellerProducts) priceByName.set(p.name, {price: p.price, productId: p.productId})

    const orderedByProduct: Array<{ name: string; data: ProductData }> = []
    const seen = new Set<string>()
    for (const order of input.activeOrders) {
        for (const item of order.items) {
            if (!item.name) continue
            if (!seen.has(item.name)) {
                seen.add(item.name)
                orderedByProduct.push({
                    name: item.name,
                    data: {
                        qty: 0,
                        ingredients: item.ingredients.filter((i) => i.name).map((i) => ({
                            name: i.name,
                            amountPerUnit: i.amount,
                        })),
                    },
                })
            }
            const entry = orderedByProduct.find((e) => e.name === item.name)
            if (!entry) continue
            entry.data.qty += item.quantity || 1
        }
    }

    const stockByName: Record<string, number> = {}
    const ingIdByName: Record<string, number> = {}
    for (const ing of input.ingredients) {
        stockByName[ing.name] = ing.stock
        ingIdByName[ing.name] = ing.ingredientId
    }

    const model: LpModel = {optimize: 'profit', opType: 'max', constraints: {}, variables: {}, ints: {}}
    for (const ing of input.ingredients) {
        model.constraints[`stock_${ing.ingredientId}`] = {max: ing.stock}
    }
    for (let j = 0; j < orderedByProduct.length; j++) {
        const {name, data} = orderedByProduct[j]
        const price = priceByName.get(name)?.price ?? 0
        const varName = `y_${j}`
        const upperKey = `upper_${j}`
        model.variables[varName] = {profit: price, [upperKey]: 1}
        model.constraints[upperKey] = {max: data.qty}
        model.ints[varName] = 1
        for (const ing of data.ingredients) {
            const ingId = ingIdByName[ing.name]
            if (ingId === undefined) continue
            const key = `stock_${ingId}`
            model.variables[varName][key] = (model.variables[varName][key] || 0) + ing.amountPerUnit
        }
    }

    const result = deps.solver.solve(model)
    const items: MaxProfitProductItem[] = []
    let maxRevenue = 0
    for (let j = 0; j < orderedByProduct.length; j++) {
        const {name, data} = orderedByProduct[j]
        const raw = result[`y_${j}`]
        const fulfillQty = typeof raw === 'number' ? Math.round(raw) : 0
        const price = priceByName.get(name)?.price ?? 0
        const revenue = fulfillQty * price
        maxRevenue += revenue

        let limitingIngredient: string | undefined
        if (fulfillQty < data.qty) {
            for (const ing of data.ingredients) {
                const stock = stockByName[ing.name] || 0
                if (stock < ing.amountPerUnit * data.qty) {
                    limitingIngredient = ing.name
                    break
                }
            }
        }

        items.push({
            productId: priceByName.get(name)?.productId ?? 0,
            name,
            orderedQty: data.qty,
            fulfillQty,
            price,
            revenue,
            limitingIngredient,
        })
    }

    return {
        maxRevenue,
        items: items.sort((a, b) => b.revenue - a.revenue),
        feasible: result.feasible !== false,
    }
}
