import { NextResponse } from 'next/server';
import { db, sellers, products } from '@/src/db';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    // If ID is provided, return a single seller
    if (id) {
      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.seller_id, parseInt(id)),
        with: {
          products: true,
        },
      });
      
      if (!seller) {
        return NextResponse.json(
          { error: 'Seller not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(seller);
    }
    
    // Get all sellers
    const allSellers = await db.select().from(sellers);
    
    return NextResponse.json(allSellers);
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sellers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.seller_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new seller
    const newSeller = await db.insert(sellers).values({
      seller_name: body.seller_name,
      seller_rating: body.seller_rating || 0.0,
    }).returning();
    
    return NextResponse.json(newSeller[0]);
  } catch (error) {
    console.error('Error creating seller:', error);
    return NextResponse.json(
      { error: 'Failed to create seller' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.seller_id || !body.seller_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Update seller
    const updatedSeller = await db.update(sellers)
      .set({
        seller_name: body.seller_name,
        seller_rating: body.seller_rating,
      })
      .where(eq(sellers.seller_id, body.seller_id))
      .returning();
    
    if (updatedSeller.length === 0) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedSeller[0]);
  } catch (error) {
    console.error('Error updating seller:', error);
    return NextResponse.json(
      { error: 'Failed to update seller' },
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
        { error: 'Missing seller ID' },
        { status: 400 }
      );
    }
    
    // Check if seller has any products
    const productsWithSeller = await db.select()
      .from(products)
      .where(eq(products.seller_id, parseInt(id)));
    
    if (productsWithSeller.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete seller that has products' },
        { status: 400 }
      );
    }
    
    // Delete seller
    const deletedSeller = await db.delete(sellers)
      .where(eq(sellers.seller_id, parseInt(id)))
      .returning();
    
    if (deletedSeller.length === 0) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting seller:', error);
    return NextResponse.json(
      { error: 'Failed to delete seller' },
      { status: 500 }
    );
  }
}