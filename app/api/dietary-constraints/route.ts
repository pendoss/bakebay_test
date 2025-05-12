import { NextResponse } from 'next/server';
import { db, dietaryConstrains } from '@/src/db';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    // If ID is provided, return a single dietary constraint
    if (id) {
      const constraint = await db.select()
        .from(dietaryConstrains)
        .where(eq(dietaryConstrains.id, parseInt(id)));
      
      if (constraint.length === 0) {
        return NextResponse.json(
          { error: 'Dietary constraint not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(constraint[0]);
    }
    
    // Get all dietary constraints
    const allConstraints = await db.select().from(dietaryConstrains);
    
    return NextResponse.json(allConstraints);
  } catch (error) {
    console.error('Error fetching dietary constraints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dietary constraints' },
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
    
    // Create new dietary constraint
    const newConstraint = await db.insert(dietaryConstrains).values({
      name: body.name,
    }).returning();
    
    return NextResponse.json(newConstraint[0]);
  } catch (error) {
    console.error('Error creating dietary constraint:', error);
    return NextResponse.json(
      { error: 'Failed to create dietary constraint' },
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
    
    // Update dietary constraint
    const updatedConstraint = await db.update(dietaryConstrains)
      .set({
        name: body.name,
      })
      .where(eq(dietaryConstrains.id, body.id))
      .returning();
    
    if (updatedConstraint.length === 0) {
      return NextResponse.json(
        { error: 'Dietary constraint not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedConstraint[0]);
  } catch (error) {
    console.error('Error updating dietary constraint:', error);
    return NextResponse.json(
      { error: 'Failed to update dietary constraint' },
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
        { error: 'Missing dietary constraint ID' },
        { status: 400 }
      );
    }
    
    // Delete dietary constraint
    const deletedConstraint = await db.delete(dietaryConstrains)
      .where(eq(dietaryConstrains.id, parseInt(id)))
      .returning();
    
    if (deletedConstraint.length === 0) {
      return NextResponse.json(
        { error: 'Dietary constraint not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dietary constraint:', error);
    return NextResponse.json(
      { error: 'Failed to delete dietary constraint' },
      { status: 500 }
    );
  }
}