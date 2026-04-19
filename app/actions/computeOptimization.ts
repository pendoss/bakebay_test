'use server'

import {db, products} from '@/src/adapters/storage/drizzle'
import {eq} from 'drizzle-orm'
import {fetchIngredients} from './fetchIngredients'
import {getOrderIds, getOrdersDetails} from './getOrders'
import {
	computeMinPurchaseCost as domainMinPurchase,
	computeMaxProfit as domainMaxProfit,
} from '@/src/application/use-cases/optimization'
import {lpSolverJs} from '@/src/adapters/solver/lp-solver-js'
import type {
	IngredientSnapshot,
	OrderSnapshot,
} from '@/src/domain/optimization'

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

async function loadSnapshots(sellerId: number): Promise<{
	ingredients: IngredientSnapshot[];
	activeOrders: OrderSnapshot[]
}> {
	const {ingredients} = await fetchIngredients(sellerId)
	const {orderIds} = await getOrderIds(sellerId)
	const {orderDetails} = await getOrdersDetails(orderIds.map((o) => o.orderId))
	const activeOrders: OrderSnapshot[] = orderDetails
		.filter((o) => o.status === 'ordering')
		.map((o) => ({
			status: o.status,
			items: o.items.map((it) => ({
				name: it.name ?? '',
				quantity: it.quantity ?? 1,
				ingredients: it.ingredients
					.filter((i) => i.name)
					.map((i) => ({name: i.name ?? '', amount: parseFloat(String(i.amount)) || 0, unit: i.unit ?? ''})),
			})),
		}))
	const ingSnapshots: IngredientSnapshot[] = (ingredients ?? []).map((i) => ({
		ingredientId: i.ingredient_id,
		name: i.name,
		unit: i.unit,
		stock: i.stock,
		purchaseQty: i.purchase_qty,
		purchasePrice: i.purchase_price,
	}))
	return {ingredients: ingSnapshots, activeOrders}
}

export async function computeMinPurchaseCost(sellerId: number): Promise<MinPurchaseResult> {
	try {
		const {ingredients, activeOrders} = await loadSnapshots(sellerId)
		const result = domainMinPurchase({ingredients, activeOrders}, {solver: lpSolverJs()})
		return {
			total_cost: result.totalCost,
			items: result.items.map((i) => ({
				name: i.name,
				unit: i.unit,
				needed: i.needed,
				stock: i.stock,
				packages_to_buy: i.packagesToBuy,
				purchase_qty: i.purchaseQty,
				cost: i.cost,
			})),
			feasible: result.feasible,
			warning: result.warning,
		}
	} catch (error) {
		console.error('computeMinPurchaseCost error:', error)
		return {total_cost: 0, items: [], feasible: false}
	}
}

export async function computeMaxProfit(sellerId: number): Promise<MaxProfitResult> {
	try {
		const {ingredients, activeOrders} = await loadSnapshots(sellerId)
		const sellerProducts = await db
			.select({product_name: products.product_name, price: products.price, product_id: products.product_id})
			.from(products)
			.where(eq(products.seller_id, sellerId))
		const result = domainMaxProfit(
			{
				ingredients,
				activeOrders,
				sellerProducts: sellerProducts.map((p) => ({
					productId: p.product_id,
					name: p.product_name ?? '',
					price: p.price ?? 0,
				})),
			},
			{solver: lpSolverJs()},
		)
		return {
			max_revenue: result.maxRevenue,
			items: result.items.map((i) => ({
				product_id: i.productId,
				name: i.name,
				ordered_qty: i.orderedQty,
				fulfill_qty: i.fulfillQty,
				price: i.price,
				revenue: i.revenue,
				limiting_ingredient: i.limitingIngredient,
			})),
			feasible: result.feasible,
		}
	} catch (error) {
		console.error('computeMaxProfit error:', error)
		return {max_revenue: 0, items: [], feasible: false}
	}
}
