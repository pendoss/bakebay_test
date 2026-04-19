'use server'

import {orderStorageDrizzle} from '@/src/adapters/storage/drizzle/order-storage-drizzle'
import {listOrdersBySeller, getOrder} from '@/src/application/use-cases/order'
import {asOrderId, asSellerId} from '@/src/domain/shared/id'
import type {OrderStatus} from '@/src/domain/order'

interface OrderItemIngredients {
    name: string | null
    amount: number | null
    unit: string | null
}

interface OrderItem {
    name: string | null
    quantity: number | null
    ingredients: OrderItemIngredients[]
}

export interface OrderDetails {
    id: number | null
    status: OrderStatus | null
    items: OrderItem[]
}

interface OrderId {
    orderId: number
}

export async function getOrderIds(sellerId?: number | null): Promise<{ orderIds: OrderId[]; error: string | null }> {
    try {
        const storage = orderStorageDrizzle()
        const ids = sellerId
            ? await storage.listIds({sellerId: asSellerId(sellerId)})
            : await storage.listIds({})
        return {orderIds: ids.map((id) => ({orderId: id as unknown as number})), error: null}
    } catch (error) {
        console.error('Error fetching order ids:', error)
        return {orderIds: [], error: "didn't get id's"}
    }
}

export async function getOrderDetails(id: number): Promise<{ orderDetails: OrderDetails[]; error: string | null }> {
    try {
        const order = await getOrder(asOrderId(id), {orderStorage: orderStorageDrizzle()})
        return {
            orderDetails: [{
                id: order.id as unknown as number,
                status: order.status,
                items: order.items.map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                    ingredients: item.ingredients.map((ing) => ({name: ing.name, amount: ing.amount, unit: ing.unit})),
                })),
            }],
            error: null,
        }
    } catch (error) {
        console.error('Error getting order:', error)
        return {orderDetails: [], error: 'Not getting orders'}
    }
}

export async function getOrdersDetails(ids: number[]): Promise<{ orderDetails: OrderDetails[]; error: string | null }> {
    if (ids.length === 0) return {orderDetails: [], error: null}
    try {
        const storage = orderStorageDrizzle()
        const orders = await storage.listByIds(ids.map(asOrderId))
        return {
            orderDetails: orders.map((order) => ({
                id: order.id as unknown as number,
                status: order.status,
                items: order.items.map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                    ingredients: item.ingredients.map((ing) => ({name: ing.name, amount: ing.amount, unit: ing.unit})),
                })),
            })),
            error: null,
        }
    } catch (error) {
        console.error('Error getting orders:', error)
        return {orderDetails: [], error: 'Not getting orders'}
    }
}

export async function listSellerOrders(sellerId: number): Promise<{
    orderDetails: OrderDetails[];
    error: string | null
}> {
    try {
        const orders = await listOrdersBySeller(asSellerId(sellerId), {orderStorage: orderStorageDrizzle()})
        return {
            orderDetails: orders.map((order) => ({
                id: order.id as unknown as number,
                status: order.status,
                items: order.items.map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                    ingredients: item.ingredients.map((ing) => ({name: ing.name, amount: ing.amount, unit: ing.unit})),
                })),
            })),
            error: null,
        }
    } catch (error) {
        console.error('Error listing seller orders:', error)
        return {orderDetails: [], error: 'Not getting orders'}
    }
}
