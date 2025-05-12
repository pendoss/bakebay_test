import { NextResponse } from 'next/server';
import { db, dietaryConstrains, products } from '@/src/db';
import { and, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    const constraintId = url.searchParams.get('constraintId');
    
    // If productId is provided, return all constraints for that product
    if (productId) {
      const constraints = await db.select({
        product_id: dietaryConstrains.product_id,
        constraint: {
          id: dietaryConstrains.id,
          name: dietaryConstrains.name,
        },
      })
      .from(dietaryConstrains)
      .innerJoin(
        dietaryConstrains,
        eq(dietaryConstrains.id, dietaryConstrains.id)
      )
      .where(eq(dietaryConstrains.product_id, parseInt(productId)));
      
      return NextResponse.json(constraints);
    }
    
    // If constraintId is provided, return all products with that constraint
    if (constraintId) {
      const productsWithConstraint = await db.select({
        constraint_id: dietaryConstrains.dietary_constraint_id,
        product: {
          id: products.product_id,
          name: products.product_name,
          price: products.price,
          short_desc: products.short_desc,
        },
      })
      .from(dietaryConstrains)
      .innerJoin(
        products,
        eq(dietaryConstrains.product_id, products.product_id)
      )
      .where(eq(dietaryConstrains.dietary_constraint_id, parseInt(constraintId)));
      
      return NextResponse.json(productsWithConstraint);
    }
    
    // If no specific query, return all product-constraint relationships
    const allRelationships = await db.select().from(dietaryConstrains);
    
    return NextResponse.json(allRelationships);
  } catch (error) {
    console.error('Error fetching product dietary constraints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product dietary constraints' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.product_id || !body.dietary_constraint_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if product exists
    const product = await db.select()
      .from(products)
      .where(eq(products.product_id, body.product_id));
    
    if (product.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if dietary constraint exists
    const constraint = await db.select()
      .from(dietaryConstrains)
      .where(eq(dietaryConstrains.id, body.dietary_constraint_id));
    
    if (constraint.length === 0) {
      return NextResponse.json(
        { error: 'Dietary constraint not found' },
        { status: 404 }
      );
    }
    
    // Check if relationship already exists
    const existingRelationship = await db.select()
      .from(dietaryConstrains)
      .where(
        and(
          eq(dietaryConstrains.product_id, body.product_id),
          eq(dietaryConstrains.dietary_constraint_id, body.dietary_constraint_id)
        )
      );
    
    if (existingRelationship.length > 0) {
      return NextResponse.json(
        { error: 'Relationship already exists' },
        { status: 400 }
      );
    }
    
    // Create new relationship
    const newRelationship = await db.insert(dietaryConstrains).values({
      product_id: body.product_id,
      dietary_constraint_id: body.dietary_constraint_id,
    }).returning();
    
    return NextResponse.json(newRelationship[0]);
  } catch (error) {
    console.error('Error creating product dietary constraint relationship:', error);
    return NextResponse.json(
      { error: 'Failed to create relationship' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    const constraintId = url.searchParams.get('constraintId');
    
    if (!productId || !constraintId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Delete relationship
    const deletedRelationship = await db.delete(dietaryConstrains)
      .where(
        and(
          eq(dietaryConstrains.product_id, parseInt(productId)),
          eq(dietaryConstrains.dietary_constraint_id, parseInt(constraintId))
        )
      )
      .returning();
    
    if (deletedRelationship.length === 0) {
      return NextResponse.json(
        { error: 'Relationship not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product dietary constraint relationship:', error);
    return NextResponse.json(
      { error: 'Failed to delete relationship' },
      { status: 500 }
    );
  }
}