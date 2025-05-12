import { NextResponse } from 'next/server';
import { db, orders, orderItems, products } from '@/src/db/schema';
import { eq } from 'drizzle-orm';


export async function GET(request: Request) {
  try {
    // Get all orders with related data
    const allOrders = await db.query.orders.findMany({
      with: {
        user: {
          columns: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
          },
        },
        orderItems: {
          with: {
            product: true,
          },
        },
      },
    });

    // Transform the data to match the expected format in the frontend
    const formattedOrders = allOrders.map(order => ({
      id: order.order_id.toString(),
      date: new Date(order.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      status: order.order_status,
      items: order.orderItems.map(item => ({
        id: item.product.product_id,
        name: item.product.product_name,
        price: item.product.price,
        quantity: item.quantity,
      })),
      total: order.total_price || 0,
      address: order.address,
      paymentMethod: order.payment_method,
      user: order.user ? {
        name: `${order.user.first_name} ${order.user.last_name}`,
        email: order.user.email,
        phone: order.user.phone_number,
      } : undefined,
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.user_id || !body.address || !body.payment_method || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Calculate total price
    let totalPrice = 0;
    for (const item of body.items) {
      const product = await db.query.products.findFirst({
        where: eq(products.product_id, item.product_id),
      });
      
      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.product_id} not found` },
          { status: 404 }
        );
      }
      
      totalPrice += product.price * item.quantity;
    }
    
    // Create new order
    const newOrder = await db.insert(orders).values({
      date: new Date(),
      order_status: body.order_status || 'ordering',
      user_id: body.user_id,
      total_price: totalPrice,
      address: body.address,
      payment_method: body.payment_method,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    }).returning();
    
    // Create order items
    for (const item of body.items) {
      await db.insert(orderItems).values({
        order_id: newOrder[0].order_id,
        product_id: item.product_id,
        quantity: item.quantity,
      });
    }
    
    return NextResponse.json(newOrder[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.order_id) {
      return NextResponse.json(
        { error: 'Missing order ID' },
        { status: 400 }
      );
    }
    
    // Update order
    const updatedOrder = await db.update(orders)
      .set({
        order_status: body.order_status,
        address: body.address,
        payment_method: body.payment_method,
        updated_at: Math.floor(Date.now() / 1000),
      })
      .where(eq(orders.order_id, body.order_id))
      .returning();
    
    if (updatedOrder.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedOrder[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing order ID' },
        { status: 400 }
      );
    }
    
    // Delete order items first
    await db.delete(orderItems).where(eq(orderItems.order_id, parseInt(id)));
    
    // Delete order
    const deletedOrder = await db.delete(orders)
      .where(eq(orders.order_id, parseInt(id)))
      .returning();
    
    if (deletedOrder.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}