"use server"

import {db, products} from "@/src/db"
import {eq} from "drizzle-orm"
import {fetchIngredients} from "./fetchIngredients"
import {getOrderIds, getOrdersDetails} from "./getOrders"
import {solveLP} from "@/lib/simplex"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const solver = require("javascript-lp-solver")

export interface PurchaseItem {
  name: string
  unit: string
  needed: number
  stock: number
  packages_to_buy: number
  purchase_qty: number
  cost: number
}

export interface MinPurchaseResult {
  total_cost: number
  items: PurchaseItem[]
  feasible: boolean
  warning?: string
}

export interface MaxProfitProductItem {
  product_id: number
  name: string
  ordered_qty: number
  fulfill_qty: number
  price: number
  revenue: number
  limiting_ingredient?: string
}

export interface MaxProfitResult {
  max_revenue: number
  items: MaxProfitProductItem[]
  feasible: boolean
}

export async function computeMinPurchaseCost(sellerId: number): Promise<MinPurchaseResult> {
  const { ingredients, error: ingError } = await fetchIngredients(sellerId)
  if (ingError || !ingredients) {
    return { total_cost: 0, items: [], feasible: false }
  }

  const { orderIds } = await getOrderIds(sellerId)
  const { orderDetails } = await getOrdersDetails(orderIds.map(o => o.orderId))
  const activeOrders = orderDetails.filter(o => o.status === "ordering")

  // Calculate needed amount per ingredient name across all active orders
  const neededMap: Record<string, number> = {}
  for (const order of activeOrders) {
    for (const item of order.items) {
      for (const ing of item.ingredients) {
        if (!ing.name) continue
        const amount = parseFloat(String(ing.amount)) || 0
        neededMap[ing.name] = (neededMap[ing.name] || 0) + amount * (item.quantity || 1)
      }
    }
  }

  const hasMissingPrices = ingredients.some(i => i.purchase_price === 0 && i.purchase_qty > 0)

  // Build LP model: minimize cost of purchasing packages
  const modelVars: Record<string, Record<string, number>> = {}
  const modelConstraints: Record<string, { min: number }> = {}
  const modelInts: Record<string, number> = {}

  const toPurchase = ingredients.filter(ing => {
    const needed = neededMap[ing.name] || 0
    return needed > ing.stock && ing.purchase_qty > 0
  })

  for (const ing of toPurchase) {
    const needed = neededMap[ing.name] || 0
    const shortfall = needed - ing.stock
    const varName = `x_${ing.ingredient_id}`
    const constraintKey = `c_${ing.ingredient_id}`

    modelVars[varName] = {
      cost: ing.purchase_price,
      [constraintKey]: ing.purchase_qty,
    }
    modelConstraints[constraintKey] = { min: shortfall }
    modelInts[varName] = 1
  }

  const items: PurchaseItem[] = ingredients.map(ing => {
    const needed = neededMap[ing.name] || 0
    return {
      name: ing.name,
      unit: ing.unit,
      needed,
      stock: ing.stock,
      packages_to_buy: 0,
      purchase_qty: ing.purchase_qty,
      cost: 0,
    }
  })

  if (Object.keys(modelVars).length === 0) {
    return {
      total_cost: 0,
      items,
      feasible: true,
      warning: hasMissingPrices ? "Некоторые ингредиенты не имеют цены закупки" : undefined,
    }
  }

  const result = solver.Solve({
    optimize: "cost",
    opType: "min",
    constraints: modelConstraints,
    variables: modelVars,
    ints: modelInts,
  })

  let totalCost = 0
  for (const item of items) {
    const ing = ingredients.find(i => i.name === item.name)
    if (!ing) continue
    const varName = `x_${ing.ingredient_id}`
    const packages = Math.ceil(result[varName] || 0)
    const cost = packages * ing.purchase_price
    item.packages_to_buy = packages
    item.cost = cost
    totalCost += cost
  }

  return {
    total_cost: totalCost,
    items: items.sort((a, b) => b.cost - a.cost),
    feasible: result.feasible !== false,
    warning: hasMissingPrices ? "Некоторые ингредиенты не имеют цены закупки" : undefined,
  }
}

export async function computeMaxProfit(sellerId: number): Promise<MaxProfitResult> {
  const { ingredients } = await fetchIngredients(sellerId)
  if (!ingredients) return { max_revenue: 0, items: [], feasible: false }

  const { orderIds } = await getOrderIds(sellerId)
  const { orderDetails } = await getOrdersDetails(orderIds.map(o => o.orderId))
  const activeOrders = orderDetails.filter(o => o.status === "ordering")

  if (activeOrders.length === 0) return { max_revenue: 0, items: [], feasible: true }

  // Get product prices for this seller
  const sellerProducts = await db.select({
    product_name: products.product_name,
    price: products.price,
    product_id: products.product_id,
  }).from(products).where(eq(products.seller_id, sellerId))

  const priceByName: Record<string, { price: number; product_id: number }> = {}
  for (const p of sellerProducts) {
    if (p.product_name) priceByName[p.product_name] = { price: p.price ?? 0, product_id: p.product_id }
  }

  // Aggregate ordered quantities per product
  interface ProductData {
    qty: number
    ingredients: Array<{ name: string; amountPerUnit: number }>
  }
  const orderedByProduct: Array<{ name: string; data: ProductData }> = []
  const seenProducts = new Set<string>()

  for (const order of activeOrders) {
    for (const item of order.items) {
      if (!item.name) continue
      if (!seenProducts.has(item.name)) {
        seenProducts.add(item.name)
        orderedByProduct.push({
          name: item.name,
          data: {
            qty: 0,
            ingredients: item.ingredients
              .filter(i => i.name)
              .map(i => ({ name: i.name!, amountPerUnit: parseFloat(String(i.amount)) || 0 })),
          },
        })
      }
      const entry = orderedByProduct.find(e => e.name === item.name)!
      entry.data.qty += item.quantity || 1
    }
  }

  const stockByName: Record<string, number> = {}
  for (const ing of ingredients) {
    stockByName[ing.name] = ing.stock
  }

  // Build LP model: maximize profit
  const modelVars: Record<string, Record<string, number>> = {}
  const modelConstraints: Record<string, { min?: number; max?: number }> = {}
  const modelInts: Record<string, number> = {}

  // Initialize stock constraints
  for (const ing of ingredients) {
    const key = `stock_${ing.ingredient_id}`
    modelConstraints[key] = { max: ing.stock }
  }

  const ingIdByName: Record<string, number> = {}
  for (const ing of ingredients) {
    ingIdByName[ing.name] = ing.ingredient_id
  }

  for (let j = 0; j < orderedByProduct.length; j++) {
    const { name, data } = orderedByProduct[j]
    const price = priceByName[name]?.price || 0
    const varName = `y_${j}`
    const upperKey = `upper_${j}`

    modelVars[varName] = { profit: price, [upperKey]: 1 }
    modelConstraints[upperKey] = { max: data.qty }
    modelInts[varName] = 1

    for (const ing of data.ingredients) {
      const ingId = ingIdByName[ing.name]
      if (ingId === undefined) continue
      const key = `stock_${ingId}`
      modelVars[varName][key] = (modelVars[varName][key] || 0) + ing.amountPerUnit
    }
  }

  const result = solver.Solve({
    optimize: "profit",
    opType: "max",
    constraints: modelConstraints,
    variables: modelVars,
    ints: modelInts,
  })

  const items: MaxProfitProductItem[] = []
  let maxRevenue = 0

  for (let j = 0; j < orderedByProduct.length; j++) {
    const { name, data } = orderedByProduct[j]
    const varName = `y_${j}`
    const fulfillQty = Math.round(result[varName] || 0)
    const price = priceByName[name]?.price || 0
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
      product_id: priceByName[name]?.product_id || 0,
      name,
      ordered_qty: data.qty,
      fulfill_qty: fulfillQty,
      price,
      revenue,
      limiting_ingredient: limitingIngredient,
    })
  }

  return {
    max_revenue: maxRevenue,
    items: items.sort((a, b) => b.revenue - a.revenue),
    feasible: result.feasible !== false,
  }
}

// ── Собственная реализация на базе lib/simplex.ts ────────────────────────────

/**
 * computeMinPurchaseCostCustom — то же что computeMinPurchaseCost,
 * но использует собственный симплекс-решатель вместо javascript-lp-solver.
 * Дополнительно возвращает _iterations (число итераций симплекса) и _timeMs.
 */
export async function computeMinPurchaseCostCustom(
    sellerId: number
): Promise<MinPurchaseResult & { _iterations: number; _timeMs: number }> {
  const {ingredients, error: ingError} = await fetchIngredients(sellerId)
  if (ingError || !ingredients) {
    return {total_cost: 0, items: [], feasible: false, _iterations: 0, _timeMs: 0}
  }

  const {orderIds} = await getOrderIds(sellerId)
  const {orderDetails} = await getOrdersDetails(orderIds.map(o => o.orderId))
  const activeOrders = orderDetails.filter(o => o.status === "ordering")

  const neededMap: Record<string, number> = {}
  for (const order of activeOrders) {
    for (const item of order.items) {
      for (const ing of item.ingredients) {
        if (!ing.name) continue
        const amount = parseFloat(String(ing.amount)) || 0
        neededMap[ing.name] = (neededMap[ing.name] || 0) + amount * (item.quantity || 1)
      }
    }
  }

  const hasMissingPrices = ingredients.some(i => i.purchase_price === 0 && i.purchase_qty > 0)

  const modelVars: Record<string, Record<string, number>> = {}
  const modelConstraints: Record<string, { min: number }> = {}
  const modelInts: Record<string, number> = {}

  const toPurchase = ingredients.filter(ing => {
    const needed = neededMap[ing.name] || 0
    return needed > ing.stock && ing.purchase_qty > 0
  })

  for (const ing of toPurchase) {
    const needed = neededMap[ing.name] || 0
    const shortfall = needed - ing.stock
    const varName = `x_${ing.ingredient_id}`
    const constraintKey = `c_${ing.ingredient_id}`

    modelVars[varName] = {
      cost: ing.purchase_price,
      [constraintKey]: ing.purchase_qty,
    }
    modelConstraints[constraintKey] = {min: shortfall}
    modelInts[varName] = 1
  }

  const items: PurchaseItem[] = ingredients.map(ing => {
    const needed = neededMap[ing.name] || 0
    return {
      name: ing.name,
      unit: ing.unit,
      needed,
      stock: ing.stock,
      packages_to_buy: 0,
      purchase_qty: ing.purchase_qty,
      cost: 0,
    }
  })

  if (Object.keys(modelVars).length === 0) {
    return {
      total_cost: 0,
      items,
      feasible: true,
      _iterations: 0,
      _timeMs: 0,
      warning: hasMissingPrices ? "Некоторые ингредиенты не имеют цены закупки" : undefined,
    }
  }

  const result = solveLP({
    optimize: "cost",
    opType: "min",
    constraints: modelConstraints,
    variables: modelVars,
    ints: modelInts,
  })

  let totalCost = 0
  for (const item of items) {
    const ing = ingredients.find(i => i.name === item.name)
    if (!ing) continue
    const varName = `x_${ing.ingredient_id}`
    const packages = Math.ceil((result[varName] as number) || 0)
    const cost = packages * ing.purchase_price
    item.packages_to_buy = packages
    item.cost = cost
    totalCost += cost
  }

  return {
    total_cost: totalCost,
    items: items.sort((a, b) => b.cost - a.cost),
    feasible: result.feasible !== false,
    _iterations: result._iterations,
    _timeMs: result._timeMs,
    warning: hasMissingPrices ? "Некоторые ингредиенты не имеют цены закупки" : undefined,
  }
}

/**
 * computeMaxProfitCustom — то же что computeMaxProfit,
 * но использует собственный симплекс-решатель.
 */
export async function computeMaxProfitCustom(
    sellerId: number
): Promise<MaxProfitResult & { _iterations: number; _timeMs: number }> {
  const {ingredients} = await fetchIngredients(sellerId)
  if (!ingredients) return {max_revenue: 0, items: [], feasible: false, _iterations: 0, _timeMs: 0}

  const {orderIds} = await getOrderIds(sellerId)
  const {orderDetails} = await getOrdersDetails(orderIds.map(o => o.orderId))
  const activeOrders = orderDetails.filter(o => o.status === "ordering")

  if (activeOrders.length === 0) return {max_revenue: 0, items: [], feasible: true, _iterations: 0, _timeMs: 0}

  const sellerProducts = await db.select({
    product_name: products.product_name,
    price: products.price,
    product_id: products.product_id,
  }).from(products).where(eq(products.seller_id, sellerId))

  const priceByName: Record<string, { price: number; product_id: number }> = {}
  for (const p of sellerProducts) {
    if (p.product_name) priceByName[p.product_name] = {price: p.price ?? 0, product_id: p.product_id}
  }

  interface ProductData {
    qty: number
    ingredients: Array<{ name: string; amountPerUnit: number }>
  }

  const orderedByProduct: Array<{ name: string; data: ProductData }> = []
  const seenProducts = new Set<string>()

  for (const order of activeOrders) {
    for (const item of order.items) {
      if (!item.name) continue
      if (!seenProducts.has(item.name)) {
        seenProducts.add(item.name)
        orderedByProduct.push({
          name: item.name,
          data: {
            qty: 0,
            ingredients: item.ingredients
                .filter(i => i.name)
                .map(i => ({name: i.name!, amountPerUnit: parseFloat(String(i.amount)) || 0})),
          },
        })
      }
      const entry = orderedByProduct.find(e => e.name === item.name)!
      entry.data.qty += item.quantity || 1
    }
  }

  const stockByName: Record<string, number> = {}
  for (const ing of ingredients) {
    stockByName[ing.name] = ing.stock
  }

  const modelVars: Record<string, Record<string, number>> = {}
  const modelConstraints: Record<string, { min?: number; max?: number }> = {}
  const modelInts: Record<string, number> = {}

  for (const ing of ingredients) {
    modelConstraints[`stock_${ing.ingredient_id}`] = {max: ing.stock}
  }

  const ingIdByName: Record<string, number> = {}
  for (const ing of ingredients) {
    ingIdByName[ing.name] = ing.ingredient_id
  }

  for (let j = 0; j < orderedByProduct.length; j++) {
    const {name, data} = orderedByProduct[j]
    const price = priceByName[name]?.price || 0
    const varName = `y_${j}`
    const upperKey = `upper_${j}`

    modelVars[varName] = {profit: price, [upperKey]: 1}
    modelConstraints[upperKey] = {max: data.qty}
    modelInts[varName] = 1

    for (const ing of data.ingredients) {
      const ingId = ingIdByName[ing.name]
      if (ingId === undefined) continue
      const key = `stock_${ingId}`
      modelVars[varName][key] = (modelVars[varName][key] || 0) + ing.amountPerUnit
    }
  }

  const result = solveLP({
    optimize: "profit",
    opType: "max",
    constraints: modelConstraints,
    variables: modelVars,
    ints: modelInts,
  })

  const items: MaxProfitProductItem[] = []
  let maxRevenue = 0

  for (let j = 0; j < orderedByProduct.length; j++) {
    const {name, data} = orderedByProduct[j]
    const varName = `y_${j}`
    const fulfillQty = Math.floor((result[varName] as number) || 0)
    const price = priceByName[name]?.price || 0
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
      product_id: priceByName[name]?.product_id || 0,
      name,
      ordered_qty: data.qty,
      fulfill_qty: fulfillQty,
      price,
      revenue,
      limiting_ingredient: limitingIngredient,
    })
  }

  return {
    max_revenue: maxRevenue,
    items: items.sort((a, b) => b.revenue - a.revenue),
    feasible: result.feasible !== false,
    _iterations: result._iterations,
    _timeMs: result._timeMs,
  }
}

// ── Бенчмарк ─────────────────────────────────────────────────────────────────

export interface BenchmarkResult {
  minPurchase: {
    library: { total_cost: number; feasible: boolean; wallMs: number }
    custom: { total_cost: number; feasible: boolean; wallMs: number; solverMs: number; iterations: number }
    match: boolean
  }
  maxProfit: {
    library: { max_revenue: number; feasible: boolean; wallMs: number }
    custom: { max_revenue: number; feasible: boolean; wallMs: number; solverMs: number; iterations: number }
    match: boolean
  }
}

/**
 * benchmarkOptimization — запускает обе реализации для одного продавца
 * и сравнивает результаты и время выполнения.
 *
 * Возвращает:
 *  - wallMs   — общее время функции (включая запросы к БД)
 *  - solverMs — время только LP-решателя (только для custom)
 *  - match    — совпадают ли итоговые значения (с точностью ±1 руб./ед.)
 */
export async function benchmarkOptimization(sellerId: number): Promise<BenchmarkResult> {
  // MinPurchase: library
  let t = Date.now()
  const libMin = await computeMinPurchaseCost(sellerId)
  const libMinMs = Date.now() - t

  // MinPurchase: custom
  t = Date.now()
  const custMin = await computeMinPurchaseCostCustom(sellerId)
  const custMinMs = Date.now() - t

  // MaxProfit: library
  t = Date.now()
  const libMax = await computeMaxProfit(sellerId)
  const libMaxMs = Date.now() - t

  // MaxProfit: custom
  t = Date.now()
  const custMax = await computeMaxProfitCustom(sellerId)
  const custMaxMs = Date.now() - t

  return {
    minPurchase: {
      library: {total_cost: libMin.total_cost, feasible: libMin.feasible, wallMs: libMinMs},
      custom: {
        total_cost: custMin.total_cost,
        feasible: custMin.feasible,
        wallMs: custMinMs,
        solverMs: custMin._timeMs,
        iterations: custMin._iterations,
      },
      match: Math.abs(libMin.total_cost - custMin.total_cost) <= 1,
    },
    maxProfit: {
      library: {max_revenue: libMax.max_revenue, feasible: libMax.feasible, wallMs: libMaxMs},
      custom: {
        max_revenue: custMax.max_revenue,
        feasible: custMax.feasible,
        wallMs: custMaxMs,
        solverMs: custMax._timeMs,
        iterations: custMax._iterations,
      },
      match: Math.abs(libMax.max_revenue - custMax.max_revenue) <= 1,
    },
  }
}
