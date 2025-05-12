import { NextResponse } from 'next/server';
import { db, users } from '@/src/db';

export async function GET(request: Request) {
  try {
    // Get all users (excluding sensitive information)
    const allUsers = await db.select({
      user_id: users.user_id,
      email: users.email,
      first_name: users.first_name,
      last_name: users.last_name,
      phone_number: users.phone_number,
      address: users.address,
      city: users.city,
      postal_code: users.postal_code,
      country: users.country,
      user_role: users.user_role,
      created_at: users.created_at,
      updated_at: users.updated_at
    }).from(users);

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.first_name || !body.last_name || !body.phone_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new user
    const newUser = await db.insert(users).values({
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
      address: body.address || null,
      city: body.city || null,
      postal_code: body.postal_code || null,
      country: body.country || null,
      user_role: body.user_role || 'customer',
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    
    return NextResponse.json(newUser[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}