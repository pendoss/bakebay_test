'use server'

import {db, products, productIngredients, orderItems} from '@/src/adapters/storage/drizzle'
import {eq} from 'drizzle-orm'
import {fetchIngredients} from './fetchIngredients'
import {getOrderIds, getOrdersDetails} from './getOrders'
import {
	exportOrderSmeta as domainExportOrderSmeta,
	exportProductSmeta as domainExportProductSmeta,
	exportPurchaseList as domainExportPurchaseList,
} from '@/src/application/use-cases/optimization'
import type {IngredientSnapshot, OrderSnapshot} from '@/src/domain/optimization'

export async function exportOrderSmeta(orderId: number): Promise<string> {
	const {orderDetails} = await getOrdersDetails([orderId])
	if (!orderDetails.length) return ''
	const od = orderDetails[0]

	const ingRows = await db
		.select({
			name: productIngredients.name,
			purchase_price: productIngredients.purchase_price,
			purchase_qty: productIngredients.purchase_qty,
			unit: productIngredients.unit,
		})
		.from(orderItems)
		.innerJoin(products, eq(orderItems.product_id, products.product_id))
		.innerJoin(productIngredients, eq(products.product_id, productIngredients.product_id))
		.where(eq(orderItems.order_id, orderId))

	const order: OrderSnapshot = {
		status: od.status,
		items: od.items.map((it) => ({
			name: it.name ?? '',
			quantity: it.quantity ?? 1,
			ingredients: it.ingredients.map((i) => ({
				name: i.name ?? '',
				amount: parseFloat(String(i.amount)) || 0,
				unit: i.unit ?? '',
			})),
		})),
	}

	return domainExportOrderSmeta({
		orderId,
		order,
		pricing: ingRows.map((r) => ({
			name: r.name ?? '',
			purchasePrice: r.purchase_price ?? 0,
			purchaseQty: r.purchase_qty ?? 1,
			unit: r.unit ?? '',
		})),
	})
}

export async function exportProductSmeta(productId: number): Promise<string> {
	const product = await db
		.select({product_name: products.product_name, price: products.price})
		.from(products)
		.where(eq(products.product_id, productId))
	if (!product.length) return ''

	const ingredients = await db
		.select({
			name: productIngredients.name,
			amount: productIngredients.amount,
			unit: productIngredients.unit,
			purchase_price: productIngredients.purchase_price,
			purchase_qty: productIngredients.purchase_qty,
		})
		.from(productIngredients)
		.where(eq(productIngredients.product_id, productId))

	return domainExportProductSmeta({
		productName: product[0].product_name,
		price: product[0].price ?? 0,
		ingredients: ingredients.map((i) => ({
			name: i.name,
			amount: i.amount ?? 0,
			unit: i.unit,
			purchasePrice: i.purchase_price ?? 0,
			purchaseQty: i.purchase_qty ?? 1,
		})),
	})
}

export async function exportPurchaseList(sellerId: number): Promise<string> {
	const {ingredients} = await fetchIngredients(sellerId)
	if (!ingredients) return ''
	const {orderIds} = await getOrderIds(sellerId)
	const {orderDetails} = await getOrdersDetails(orderIds.map((o) => o.orderId))
	const activeOrders: OrderSnapshot[] = orderDetails
		.filter((o) => o.status === 'ordering')
		.map((o) => ({
			status: o.status,
			items: o.items.map((it) => ({
				name: it.name ?? '',
				quantity: it.quantity ?? 1,
				ingredients: it.ingredients.map((i) => ({
					name: i.name ?? '',
					amount: parseFloat(String(i.amount)) || 0,
					unit: i.unit ?? '',
				})),
			})),
		}))
	const ingSnapshots: IngredientSnapshot[] = ingredients.map((i) => ({
		ingredientId: i.ingredient_id,
		name: i.name,
		unit: i.unit,
		stock: i.stock,
		purchaseQty: i.purchase_qty,
		purchasePrice: i.purchase_price,
	}))
	return domainExportPurchaseList({ingredients: ingSnapshots, activeOrders})
}
