import { NextResponse } from 'next/server';
import { db, productIngredients } from '@/src/db';
import { eq } from 'drizzle-orm';

// GET endpoint to fetch ingredients for a product
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing product ID' },
        { status: 400 }
      );
    }

    // Get all ingredients for the product
    const ingredients = await db.select()
      .from(productIngredients)
      .where(eq(productIngredients.product_id, parseInt(productId)));

    return NextResponse.json(ingredients);
  } catch (error) {
    console.error('Error fetching product ingredients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product ingredients' },
      { status: 500 }
    );
  }
}

// POST endpoint to add ingredients to a product
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.product_id || !body.name || !body.unit) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new ingredient
    const newIngredient = await db.insert(productIngredients).values({
      product_id: body.product_id,
      name: body.name,
      unit: body.unit,
      stock: body.stock || 0,
      alert: body.alert || 0,
      status: body.status || "out",
    }).returning();

    return NextResponse.json(newIngredient[0]);
  } catch (error) {
    console.error('Error creating product ingredient:', error);
    return NextResponse.json(
      { error: 'Failed to create product ingredient' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update ingredients for a product
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.ingredient_id) {
      return NextResponse.json(
        { error: 'Missing ingredient ID' },
        { status: 400 }
      );
    }

    // Update ingredient
    const updatedIngredient = await db.update(productIngredients)
      .set({
        name: body.name,
        unit: body.unit,
        stock: body.stock,
        alert: body.alert,
        status: body.status,
      })
      .where(eq(productIngredients.ingredient_id, body.ingredient_id))
      .returning();

    if (updatedIngredient.length === 0) {
      return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedIngredient[0]);
  } catch (error) {
    console.error('Error updating product ingredient:', error);
    return NextResponse.json(
      { error: 'Failed to update product ingredient' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove an ingredient
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing ingredient ID' },
        { status: 400 }
      );
    }

    // Delete ingredient
    const deletedIngredient = await db.delete(productIngredients)
      .where(eq(productIngredients.ingredient_id, parseInt(id)))
      .returning();

    if (deletedIngredient.length === 0) {
      return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product ingredient:', error);
    return NextResponse.json(
      { error: 'Failed to delete product ingredient' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update or create multiple ingredients for a product
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.product_id || !Array.isArray(body.ingredients)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const productId = body.product_id;
    const ingredients = body.ingredients;

    // First, delete all existing ingredients for this product
    await db.delete(productIngredients)
      .where(eq(productIngredients.product_id, productId));

    // Then, insert all the new ingredients
    const newIngredients = [];
    for (const ingredient of ingredients) {
      if (!ingredient.name || !ingredient.amount) {
        continue; // Skip invalid ingredients
      }

      const newIngredient = await db.insert(productIngredients).values({
        product_id: productId,
        name: ingredient.name,
        unit: ingredient.amount, // Using amount as unit since that's what the UI provides
        stock: 0, // Default values
        alert: 0,
        status: "out",
      }).returning();

      newIngredients.push(newIngredient[0]);
    }

    return NextResponse.json(newIngredients);
  } catch (error) {
    console.error('Error updating product ingredients:', error);
    return NextResponse.json(
      { error: 'Failed to update product ingredients' },
      { status: 500 }
    );
  }
}