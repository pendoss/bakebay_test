import { NextResponse } from 'next/server';
import { db, categories, products } from '@/src/db';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    // If ID is provided, return a single category
    if (id) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, parseInt(id)),
        with: {
          products: true,
        },
      });
      
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(category);
    }
    
    // Get all categories
    const allCategories = await db.select().from(categories);
    
    return NextResponse.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new category
    const newCategory = await db.insert(categories).values({
      name: body.name,
    }).returning();
    
    return NextResponse.json(newCategory[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Update category
    const updatedCategory = await db.update(categories)
      .set({
        name: body.name,
      })
      .where(eq(categories.id, body.id))
      .returning();
    
    if (updatedCategory.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedCategory[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
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
        { error: 'Missing category ID' },
        { status: 400 }
      );
    }
    
    // Check if category is used by any products
    const productsWithCategory = await db.select()
      .from(products)
      .where(eq(products.category_id, parseInt(id)));
    
    if (productsWithCategory.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that is used by products' },
        { status: 400 }
      );
    }
    
    // Delete category
    const deletedCategory = await db.delete(categories)
      .where(eq(categories.id, parseInt(id)))
      .returning();
    
    if (deletedCategory.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}