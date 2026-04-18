"use server"

import {db, products, productIngredients, orderItems} from "@/src/db"
import { eq } from "drizzle-orm"
import { fetchIngredients } from "./fetchIngredients"
import { getOrderIds, getOrdersDetails } from "./getOrders"

function row(...cells: (string | number)[]): string {
  return cells.map(c => String(c)).join(";")
}

export async function exportOrderSmeta(orderId: number): Promise<string> {
  const { orderDetails } = await getOrdersDetails([orderId])
  if (!orderDetails.length) return ""

  const order = orderDetails[0]

  // Get ingredient purchase prices
  const ingRows = await db.select({
    name: productIngredients.name,
    purchase_price: productIngredients.purchase_price,
    purchase_qty: productIngredients.purchase_qty,
    unit: productIngredients.unit,
  }).from(orderItems)
    .innerJoin(products, eq(orderItems.product_id, products.product_id))
    .innerJoin(productIngredients, eq(products.product_id, productIngredients.product_id))
    .where(eq(orderItems.order_id, orderId))

  const priceByIng: Record<string, number> = {}
  for (const r of ingRows) {
    if (r.name && !priceByIng[r.name]) {
      priceByIng[r.name] = (r.purchase_qty ?? 0) > 0
        ? (r.purchase_price ?? 0) / (r.purchase_qty ?? 1)
        : 0
    }
  }

  const lines: string[] = [
    `Смета по заказу #${orderId}`,
    "",
    row("Продукт", "Кол-во", "Ингредиент", "Расход", "Ед.", "Цена/ед.", "Сумма"),
  ]

  let orderTotal = 0

  for (const item of order.items) {
    let productTotal = 0
    const qty = item.quantity || 1
    for (const ing of item.ingredients) {
      const amount = parseFloat(String(ing.amount)) || 0
      const totalAmount = amount * qty
      const pricePerUnit = priceByIng[ing.name ?? ""] ?? 0
      const lineTotal = totalAmount * pricePerUnit
      productTotal += lineTotal
      lines.push(row(item.name ?? "", qty, ing.name ?? "", totalAmount.toFixed(2), ing.unit ?? "", pricePerUnit.toFixed(2), lineTotal.toFixed(2)))
    }
    orderTotal += productTotal
    lines.push(row("", "", `ИТОГО по "${item.name}"`, "", "", "", productTotal.toFixed(2)))
  }

  lines.push(row("ИТОГО по заказу", "", "", "", "", "", orderTotal.toFixed(2)))

  return lines.join("\n")
}

export async function exportProductSmeta(productId: number): Promise<string> {
  const product = await db.select({
    product_name: products.product_name,
    price: products.price,
  }).from(products).where(eq(products.product_id, productId))

  if (!product.length) return ""

  const { product_name, price } = product[0]

  const ingredients = await db.select({
    name: productIngredients.name,
    amount: productIngredients.amount,
    unit: productIngredients.unit,
    purchase_price: productIngredients.purchase_price,
    purchase_qty: productIngredients.purchase_qty,
  }).from(productIngredients).where(eq(productIngredients.product_id, productId))

  const lines: string[] = [
    `Смета по продукту: ${product_name}`,
    "",
    row("Ингредиент", "Расход на 1 ед.", "Ед.", "Цена за ед.", "Стоимость"),
  ]

  let costPerUnit = 0

  for (const ing of ingredients) {
    const amount = ing.amount ?? 0
    const pricePerUnit = (ing.purchase_qty ?? 0) > 0
      ? (ing.purchase_price ?? 0) / (ing.purchase_qty ?? 1)
      : 0
    const lineTotal = amount * pricePerUnit
    costPerUnit += lineTotal
    lines.push(row(ing.name, amount.toFixed(2), ing.unit, pricePerUnit.toFixed(2), lineTotal.toFixed(2)))
  }

  const margin = (price ?? 0) - costPerUnit

  lines.push(row("СЕБЕСТОИМОСТЬ", "", "", "", costPerUnit.toFixed(2)))
  lines.push(row("Цена продажи", "", "", "", (price ?? 0).toFixed(2)))
  lines.push(row("Маржа", "", "", "", margin.toFixed(2)))

  return lines.join("\n")
}

export async function exportPurchaseList(sellerId: number): Promise<string> {
  const { ingredients } = await fetchIngredients(sellerId)
  if (!ingredients) return ""

  const { orderIds } = await getOrderIds(sellerId)
  const { orderDetails } = await getOrdersDetails(orderIds.map(o => o.orderId))
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

  const lines: string[] = [
    "Список закупок (активные заказы)",
    "",
    row("Ингредиент", "Нужно", "В наличии", "Докупить", "Упаковок", "Цена/уп.", "Итого"),
  ]

  let grandTotal = 0

  for (const ing of ingredients) {
    const needed = neededMap[ing.name] || 0
    const shortfall = Math.max(0, needed - ing.stock)
    const packages = ing.purchase_qty > 0 ? Math.ceil(shortfall / ing.purchase_qty) : 0
    const lineTotal = packages * ing.purchase_price
    grandTotal += lineTotal
    lines.push(row(
      ing.name,
      needed.toFixed(2),
      ing.stock.toFixed(2),
      shortfall.toFixed(2),
      packages,
      ing.purchase_price.toFixed(2),
      lineTotal.toFixed(2),
    ))
  }

  lines.push(row("ИТОГО", "", "", "", "", "", grandTotal.toFixed(2)))

  return lines.join("\n")
}
