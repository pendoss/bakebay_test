import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { db, orders, orderItems, products, users } from "@/src/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sellerId = url.searchParams.get('sellerId');
    
    if (!sellerId) {
      return NextResponse.json(
        { error: 'Seller ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching orders for seller ID: ${sellerId}`);
    
    // First, get all products for this seller
    const sellerProducts = await db.select({
      product_id: products.product_id,
      product_name: products.product_name,
      price: products.price,
    })
    .from(products)
    .where(eq(products.seller_id, parseInt(sellerId)));
    
    console.log(`Found ${sellerProducts.length} products for seller ${sellerId}`);
    
    if (sellerProducts.length === 0) {
      return NextResponse.json([]);
    }
    
    // Get product IDs for this seller
    const productIds = sellerProducts.map(product => product.product_id);
    
    // Get all order items containing these products
    const relevantItems = await db.select({
      order_id: orderItems.order_id,
      product_id: orderItems.product_id,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(inArray(orderItems.product_id, productIds));
    
    console.log(`Found ${relevantItems.length} order items for seller's products`);
    
    if (relevantItems.length === 0) {
      return NextResponse.json([]);
    }
    
    // Get unique order IDs and filter out any nulls
    const orderIds = [...new Set(relevantItems.map(item => item.order_id))].filter(Boolean) as number[];
    
    // Fetch full orders
    const sellerOrders = await db.select()
      .from(orders)
      .where(inArray(orders.order_id, orderIds));
    
    console.log(`Found ${sellerOrders.length} orders for seller ${sellerId}`);
    
    // Format results by fetching additional details for each order
    const formattedOrders = await Promise.all(sellerOrders.map(async (order) => {
      // Get order items for this order that belong to the seller
      const orderProductItems = relevantItems.filter(item => item.order_id === order.order_id);
      
      // Get product details for items
      const itemsWithDetails = await Promise.all(orderProductItems.map(async (item) => {
        const product = sellerProducts.find(p => p.product_id === item.product_id);
        return {
          id: item.product_id,
          name: product?.product_name || "Unknown Product",
          price: product?.price || 0,
          quantity: item.quantity,
        };
      }));
      
      // Get customer details
      let customer = { name: "Unknown Customer", email: "unknown@example.com", address: "адресса нет" };
      if (order.user_id) {
        const userResult = await db.select()
          .from(users)
          .where(eq(users.user_id, order.user_id));
        
        if (userResult.length > 0) {
          const user = userResult[0];
          customer = {
            name: `${user.first_name} ${user.last_name}`,
            email: user.email || "no-email@example.com",
            address: user.address || ""
          };
        }
      }
      
      // Calculate total for just this seller's items
      const sellerSubtotal = itemsWithDetails.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );

      return {
        id: order.order_id.toString(),
        date: new Date(order.date).toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        status: order.order_status,
        items: itemsWithDetails,
        total: sellerSubtotal,
        address: order.address,
        paymentMethod: order.payment_method,
        customer
      };
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller orders', details: error.message },
      { status: 500 }
    );
  }
}