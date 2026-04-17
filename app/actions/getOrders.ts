"use server"
import {db, orderItems, orders, productIngredients, products} from "@/src/db";
import {eq, inArray} from "drizzle-orm";


interface OrderItemIngredients {
    name: string | null,
    amount: number | null,
    unit: string | null,
}
interface OrderItem {
    name: string| null,
    quantity: number | null,
    ingredients: OrderItemIngredients []
}

export interface OrderDetails {
    id: number | null,
    status: "ordering" | "processing" | "payed" | "processed" | "in_progress" | "delivering" | "delivered" | null,
    items: OrderItem []

}

interface OrderId{
    orderId: number
}

export async function getOrderIds(sellerId?: number | null): Promise<{ orderIds: OrderId[], error: string | null }> {
    try{
        let result: OrderId[];
        if (sellerId) {
            result = await db.selectDistinct({orderId: orders.order_id})
                .from(orders)
                .leftJoin(orderItems, eq(orders.order_id, orderItems.order_id))
                .leftJoin(products, eq(orderItems.product_id, products.product_id))
                .where(eq(products.seller_id, sellerId));
        } else {
            result = await db.select({orderId: orders.order_id}).from(orders);
        }

        return {orderIds: result, error: null}
    } catch {
        return {orderIds: [], error: "didn't get id's"}
    }

}

export async function getOrderDetails(id: number): Promise<{orderDetails: OrderDetails[], error: string | null}>{
    try{
//         select
//     o.order_id,
//     o.order_status,
//     o.total_price,
//     o.created_at,
//     oi.quantity,
//     p.product_id,
//     p.product_name,
//     pi.name as ingredient_name,
//     pi.unit as ingredient_amount
// from orders o
// left join
//     order_items oi on o.order_id = oi.order_id
// left join
//     products p on oi.product_id = p.product_id
// left join
//     product_ingredients pi on p.product_id = pi.product_id
// where o.order_id = 8
        console.log(id);
        const ingredientsForOrder = await db.select({
            id: orders.order_id,
            status: orders.order_status,
            quantity: orderItems.quantity,
            name: products.product_name,
            ingredient_name: productIngredients.name,
            amount: productIngredients.amount,
            unit: productIngredients.unit
        }).from(orders).leftJoin(
            orderItems, eq(orders.order_id, orderItems.order_id)
        ).leftJoin(
            products, eq(orderItems.product_id,products.product_id)
        ).leftJoin(
            productIngredients, eq(products.product_id, productIngredients.product_id)
        ).where(eq(orders.order_id, +id))


        // console.log("ing for order" ,ingredientsForOrder)
        // const orderItemIng: OrderItemIngredients[]= []

        // ingredientsForOrder.forEach((ing) =>  {
        //     orderItemIng.push({name: ing.ingredient_name, amount: ing.amount})
        // })

        // const orderItemsArr: OrderItem[] = [];
        // const uniqueOrderItems: OrderItem [] = []

        // ingredientsForOrder.forEach( item => {
        //     if(!uniqueOrderItems.includes(item)){

        //     }
        // })

        // ingredientsForOrder.forEach((order) => {
        //     orderItemsArr.push()
        // })
        // console.log(orderItemIng)
        // console.log("result", ingredientsForOrder);


        // Group the results by product name
        const productsMap = new Map<string, {
            name: string,
            quantity: number,
            ingredients: OrderItemIngredients[]
        }>();

        // Process each row
        ingredientsForOrder.forEach(row => {
            if (!row.name) return;

            if (!productsMap.has(row.name)) {
                productsMap.set(row.name, {
                    name: row.name,
                    quantity: row.quantity || 1, 
                    ingredients: []
                });
            }
            
            if (row.ingredient_name) {
                const product = productsMap.get(row.name);
                if (!product) continue;
                
                if (!product.ingredients.some(i => i.name === row.ingredient_name)) {
                    product.ingredients.push({
                        name: row.ingredient_name,
                        amount: row.amount,
                        unit: row.unit,
                    });
                }
            }
        });

        const orderDetail: OrderDetails = {
            id: id, 
            status: ingredientsForOrder[0]?.status,
            items: Array.from(productsMap.values())
        };

        console.log("orderDetails",orderDetail)

        return { orderDetails: [orderDetail], error: null}
    } catch (error){
        console.log("Error getting orders:", error);
        return {orderDetails: [], error : "Not getting orders"}
    }
}

export async function getOrdersDetails(ids: number[]): Promise<{ orderDetails: OrderDetails[], error: string | null }> {
    if (ids.length === 0) return { orderDetails: [], error: null }
    try {
        const rows = await db.select({
            id: orders.order_id,
            status: orders.order_status,
            quantity: orderItems.quantity,
            name: products.product_name,
            ingredient_name: productIngredients.name,
            amount: productIngredients.amount,
            unit: productIngredients.unit,
        }).from(orders)
            .leftJoin(orderItems, eq(orders.order_id, orderItems.order_id))
            .leftJoin(products, eq(orderItems.product_id, products.product_id))
            .leftJoin(productIngredients, eq(products.product_id, productIngredients.product_id))
            .where(inArray(orders.order_id, ids))

        const ordersMap = new Map<number, OrderDetails>()

        for (const row of rows) {
            if (row.id === null) continue

            if (!ordersMap.has(row.id)) {
                ordersMap.set(row.id, { id: row.id, status: row.status, items: [] })
            }

            const order = ordersMap.get(row.id)
            if (!order) continue
            if (!row.name) continue

            let product = order.items.find(i => i.name === row.name)
            if (!product) {
                product = { name: row.name, quantity: row.quantity || 1, ingredients: [] }
                order.items.push(product)
            }

            if (row.ingredient_name && !product.ingredients.some(i => i.name === row.ingredient_name)) {
                product.ingredients.push({ name: row.ingredient_name, amount: row.amount, unit: row.unit })
            }
        }

        return { orderDetails: Array.from(ordersMap.values()), error: null }
    } catch (error) {
        console.error("Error getting orders:", error)
        return { orderDetails: [], error: "Not getting orders" }
    }
}