import { NextResponse } from 'next/server';
import { db, users } from '@/src/db';
import bcrypt from "bcryptjs";
import { Decode, Encode } from '../jwt';


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




interface registerData{
  name: string
  email: string
  password:string
}

export async function POST(request: Request) {
  try {
    const body:registerData = await request.json();
    
    // Validate required fields
    if (body.name.split(" ").length != 2){
      return NextResponse.json(
        {error: "name and last name is required"},
        {status: 400}
      )
    }
    const names = body.name.split(" ")
    if (names[0] == "" || names[1]==""){
        return NextResponse.json(
        {error: "name and last name is required"},
        {status: 400}
      )
    }
    
    if (!body.email ||  !body.password ) {
      return NextResponse.json(
        { error: 'email and password are required' },
        { status: 400 }
      );
    }

    const hashedPassword = bcrypt.hashSync(body.password, Number(process.env.SECRET));


    const newUser = await db.insert(users).values({
      email: body.email,
      first_name: names[0],
      last_name: names[1],
      phone_number: "+79999999999",
      address: "",
      city:  null,
      postal_code:  null,
      country:  null,
      user_role: 'customer',
      created_at: new Date(),
      updated_at: new Date(),
      password: hashedPassword,
    }).returning();
    
    return NextResponse.json({
      "token": Encode({userId: newUser[0].user_id, role: newUser[0].user_role!})
      });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}