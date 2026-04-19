import {
    aggregateNeeded,
    buildPurchaseList,
    hasMissingPrices,
    sumCost,
} from '@/src/domain/optimization'
import type {
    IngredientSnapshot,
    OrderSnapshot,
    PurchaseItem,
} from '@/src/domain/optimization'
import type {LpSolver, LpModel} from '@/src/application/ports/lp-solver'

export interface MinPurchaseResult {
    totalCost: number
    items: PurchaseItem[]
    feasible: boolean
    warning?: string
}

export interface ComputeMinPurchaseInput {
    ingredients: IngredientSnapshot[]
    activeOrders: OrderSnapshot[]
}

export interface ComputeMinPurchaseDeps {
    solver: LpSolver
}

export function computeMinPurchaseCost(
    input: ComputeMinPurchaseInput,
    deps: ComputeMinPurchaseDeps,
): MinPurchaseResult {
    const needed = aggregateNeeded(input.activeOrders)
    const items = buildPurchaseList(input.ingredients, needed)
    const warning = hasMissingPrices(input.ingredients) ? 'Некоторые ингредиенты не имеют цены закупки' : undefined

    const toPurchase = input.ingredients.filter((ing) => {
        const n = needed[ing.name] || 0
        return n > ing.stock && ing.purchaseQty > 0
    })
    if (toPurchase.length === 0) {
        return {totalCost: 0, items, feasible: true, warning}
    }

    const model: LpModel = {
        optimize: 'cost',
        opType: 'min',
        constraints: {},
        variables: {},
        ints: {},
    }
    for (const ing of toPurchase) {
        const needAmount = needed[ing.name] || 0
        const shortfall = needAmount - ing.stock
        const varName = `x_${ing.ingredientId}`
        const key = `c_${ing.ingredientId}`
        model.variables[varName] = {cost: ing.purchasePrice, [key]: ing.purchaseQty}
        model.constraints[key] = {min: shortfall}
        model.ints[varName] = 1
    }

    const result = deps.solver.solve(model)
    for (const item of items) {
        const ing = input.ingredients.find((i) => i.name === item.name)
        if (!ing) continue
        const raw = result[`x_${ing.ingredientId}`]
        const packages = typeof raw === 'number' ? Math.ceil(raw) : 0
        item.packagesToBuy = packages
        item.cost = packages * ing.purchasePrice
    }

    return {
        totalCost: sumCost(items),
        items: items.sort((a, b) => b.cost - a.cost),
        feasible: result.feasible !== false,
        warning,
    }
}
