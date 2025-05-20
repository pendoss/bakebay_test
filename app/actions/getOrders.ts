"use server"
import { OrderItems } from "@/components/order-card";
import { db, orderItems, orders, productIngredients, products } from "@/src/db";
import { eq } from "drizzle-orm";


interface OrderItemIngredients {
    name: string | null,
    amount: number | null
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

export async function getOrderIds(): Promise<{orderIds: OrderId[], error: string | null}>{
    try{
        const result = await db.select({orderId: orders.order_id}).from(orders)

        return {orderIds: result, error: null}
    } catch (error) {
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
            amount: productIngredients.amount
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
                const product = productsMap.get(row.name)!;
                
                if (!product.ingredients.some(i => i.name === row.ingredient_name)) {
                    product.ingredients.push({
                        name: row.ingredient_name,
                        amount: row.amount
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