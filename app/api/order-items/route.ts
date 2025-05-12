import { NextResponse } from 'next/server';
import { db, orderItems, orders, products } from '@/src/db';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    
    // Build query
    let query = db.select()
      .from(orderItems)
      .leftJoin(products, eq(orderItems.product_id, products.product_id))
      .leftJoin(orders, eq(orderItems.order_id, orders.order_id));
    
    // Filter by order_id if provided
    if (orderId) {
      query = query.where(eq(orderItems.order_id, parseInt(orderId)));
    }
    
    // Execute query
    const items = await query;
    
    // Format response
    const formattedItems = items.map(item => ({
      order_item_id: item.order_items.order_item_id,
      order_id: item.order_items.order_id,
      product_id: item.order_items.product_id,
      quantity: item.order_items.quantity,
      product: item.products ? {
        name: item.products.product_name,
        price: item.products.price,
        description: item.products.short_desc
      } : null,
      order_status: item.order?.order_status || null
    }));
    
    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error('Error fetching order items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order items' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.order_id || !body.product_id || !body.quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, product_id, and quantity are required' },
        { status: 400 }
      );
    }
    
    // Create new order item
    const newOrderItem = await db.insert(orderItems).values({
      order_id: body.order_id,
      product_id: body.product_id,
      quantity: body.quantity
    }).returning();
    
    return NextResponse.json(newOrderItem[0]);
  } catch (error) {
    console.error('Error creating order item:', error);
    return NextResponse.json(
      { error: 'Failed to create order item' },
      { status: 500 }
    );
  }
}