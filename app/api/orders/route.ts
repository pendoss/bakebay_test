import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import {OrderItems} from "@/components/order-card";
import {db, orders, orderItems, products, users} from "@/src/db";
import { updateStockById } from '@/app/actions/addIngredient';


export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // 1. Get orders
    const orderQuery = userId 
      ? db.select().from(orders).where(eq(orders.user_id, parseInt(userId)))
      : db.select().from(orders);
      
    const allOrders = await orderQuery;
    
    // 2. For each order, get the items separately
    const formattedOrders = await Promise.all(allOrders.map(async (order) => {
      // Get order items
      const items = await db.select()
        .from(orderItems)
        .where(eq(orderItems.order_id, order.order_id))
        .leftJoin(products, eq(orderItems.product_id, products.product_id));
      
      // Get user info if needed
      let user = null;
      if (order.user_id) {
        const userResult = await db.select()
          .from(users)
          .where(eq(users.user_id, order.user_id));
        
        if (userResult.length > 0) {
          user = userResult[0];
        }
      }
      
      // Return formatted order
      return {
        id: order.order_id.toString(),
        date: new Date(order.date).toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        status: order.order_status,
        items: items.map(item => ({
          id: item.products?.product_id,
          name: item.products?.product_name || "Unknown Product",
          price: item.products?.price || 0,
          quantity: item.order_items.quantity,
        })),
        total: order.total_price || 0,
        address: order.address,
        paymentMethod: order.payment_method,
        user: user ? {
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: user.phone_number,
        } : undefined,
      };
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
    
    // Add detailed logging to see what's coming in
    console.log("Received order request with body:", body);

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
      // Log each lookup attempt to debug product ID issues
      console.log(`Looking up product with ID: ${item.product_id}`);
      
      const product = await db.query.products.findFirst({
        where: eq(products.product_id, item.product_id),
      });

      if (!product) {
        console.log(`Product with ID ${item.product_id} not found in database`);
        return NextResponse.json(
          { error: `Product with ID ${item.product_id} not found` },
          { status: 404 }
        );
      }

      totalPrice += product.price * item.quantity;
    }

    // Create new order with proper error handling
    try {
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
      
      console.log("Order created:", newOrder[0]);
      
      // Create order items
      for (const item of body.items) {
        await db.insert(orderItems).values({
          order_id: newOrder[0].order_id,
          product_id: item.product_id,
          quantity: item.quantity,
        });
      }

      return NextResponse.json(newOrder[0]);
    } catch (dbError) {
      console.error("Database error when creating order:", dbError);
      return NextResponse.json(
        { error: 'Database error when creating order', details: dbError },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error },
      { status: 500 }
    );
  }
}

// export async function PUT(request: Request) {
//   try {
//     const body = await request.json();

//     // Validate required fields
//     if (!body.order_id) {
//       return NextResponse.json(
//         { error: 'Missing order ID' },
//         { status: 400 }
//       );
//     }

//     // Update order
//     const updatedOrder = await db.update(orders)
//       .set({
//         order_status: body.order_status,
//         address: body.address,
//         payment_method: body.payment_method,
//         updated_at: Math.floor(Date.now() / 1000),
//       })
//       .where(eq(orders.order_id, body.order_id))
//       .returning();

//     if (updatedOrder.length === 0) {
//       return NextResponse.json(
//         { error: 'Order not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(updatedOrder[0]);
//   } catch (error) {
//     console.error('Error updating order:', error);
//     return NextResponse.json(
//       { error: 'Failed to update order' },
//       { status: 500 }
//     );
//   }
// }
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("Order update request:", body);

    // Validate required fields
    if (!body.order_id) {
      return NextResponse.json(
        { error: 'Missing order ID' },
        { status: 400 }
      );
    }
    
    // Update order status
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

    if (body.order_status === "delivering") {
      console.log("Processing inventory updates for delivering status");
      const items = await db.select()
        .from(orderItems)
        .where(eq(orderItems.order_id, body.order_id));
      
      console.log("Found items to process:", items);
      for (const item of items) {
        try {
          console.log(`Updating stock for product ID: ${item.product_id}`);
          await updateStockById(item.product_id!);
        } catch (stockError) {
          console.error(`Error updating stock for product ${item.product_id}:`, stockError);
        }
      }
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
