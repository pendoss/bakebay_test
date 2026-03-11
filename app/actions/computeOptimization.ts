"use server"

import { db, products } from "@/src/db"
import { eq } from "drizzle-orm"
import { fetchIngredients } from "./fetchIngredients"
import { getOrderIds, getOrdersDetails } from "./getOrders"

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
