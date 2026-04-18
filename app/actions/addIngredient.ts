"use server"

import {db, productIngredients} from "@/src/db"
import {and, eq} from "drizzle-orm"

export async function addIngredient(name: string, amount: number, unit: string, alert: number, product_id: number): Promise<{error: string | null}> {
    try {
        const currentStock = await db.selectDistinct({value: productIngredients.stock}).from(productIngredients)
            .where(and(eq(productIngredients.name, name), eq(productIngredients.product_id, product_id)))
        console.log("currentStock ", currentStock[0])
        const currentStockValue = currentStock[0].value ?? 0
        const newStock = currentStockValue + amount
        await db.update(productIngredients)
            .set({
                stock: newStock,
                unit: unit,
                alert: alert,
                status: newStock <= 0 ? "out" : (newStock <= alert ? "low" : "ok")
            })
            .where(and(eq(productIngredients.name, name), eq(productIngredients.product_id, product_id)))
        return {error: ""}
    } catch(error){
        console.log("Error adding ingredient", error);
        return {error: "Can add ingredient"}
    }
}
export async function updateStockById(productId: number): Promise<{sucsess: boolean, error: string | null}> {
    try {
        const currentStock = await db.select({
            value: productIngredients.stock, 
            amount: productIngredients.amount, 
            ing_id: productIngredients.ingredient_id,
            ing_name: productIngredients.name,
            alert: productIngredients.alert
        }).from(productIngredients).where(eq(productIngredients.product_id, productId));
        
        console.log("currentStock by id ", currentStock);
        
        // Use Promise.all instead of forEach to handle async operations
        await Promise.all(currentStock.map(async (item) => {
            const newStock = (item.value ?? 0) - item.amount;
            const alertVal = item.alert ?? 0;
            const status = newStock <= 0 ? "out" : (newStock <= alertVal ? "low" : "ok");
            
            await db.update(productIngredients).set({stock: newStock,status: status}).where(eq(productIngredients.name, item.ing_name));
            
            console.log(`Updated ingredient ${item.ing_id}: new stock = ${newStock}, status = ${status}`);
        }));
       
        return {sucsess: true, error: ""};
    } catch (error) {
        console.log("error updating stock by id", error);
        return {sucsess: false, error: "Can't update stock by ID"};
    }
}



// export async function updateIngredientStock(orderId: number): Promise<{ success: boolean, error: string | null }> {
//     try {
//         // Fetch the order data using the orde-rId
//         const order = await fetchOrderById(orderId);
        
//         if (!order) {
//             return { success: false, error: "Order not found" };
//         }
        
//         console.log("current order", order);
        
//         for (const item of order.items) {
//             for (const ingredient of item.ingredients) {
//                 const currentStockResult = await db
//                     .selectDistinct({ value: productIngredients.stock })
//                     .from(productIngredients)
//                     .where(eq(productIngredients.name, ingredient.name));
                    
//                 console.log("currentStockResult", currentStockResult);
                
//                 if (currentStockResult && currentStockResult.length > 0) {
//                     const currentStock = currentStockResult[0].value || 0;
//                     const amountToSubtract = parseFloat(ingredient.amount) * item.quantity;
//                     const newStock = Math.max(0, currentStock - amountToSubtract);
                    
//                     const alertResult = await db
//                         .selectDistinct({ value: productIngredients.alert })
//                         .from(productIngredients)
//                         .where(eq(productIngredients.name, ingredient.name));
                        
//                     const alertThreshold = alertResult && alertResult.length > 0 ? alertResult[0].value || 10 : 10;
                    
//                     await db.update(productIngredients)
//                         .set({
//                             stock: newStock,
//                             status: newStock > alertThreshold ? "ok" : "low"
//                         })
//                         .where(eq(productIngredients.name, ingredient.name));
//                 }
//             }
//         }
        
//         return { success: true, error: null };
//     } catch (error) {
//         console.error("Error updating ingredient stock:", error);
//         return { success: false, error: "Failed to update ingredient stock" };
//     }
// }

// // You need to implement this function based on your database schema
// async function fetchOrderById(orderId: number): Promise<{orderDetails: OrderDetails[], error: string | null}> {
//     try {
//         const orderDetails  = getOrderDetails(orderId)
        
//         return orderDetails
//     } catch (error) {
//         console.error("Error fetching order:", error);
//         return {orderDetails: [], error: "error fethcing order"};
//     }
// }

