import type { NextApiRequest, NextApiResponse } from 'next'
import { db, users } from "@/src/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from 'next/server';
import { Decode, Encode } from '../jwt';


const unauthorized = 'bebe chel'

interface credentials {
    email: string
    password: string
}

export async function POST(req: Request) {
    try {
        const creds: credentials = await req.json()

        const jwt = await signIn(creds)
        return NextResponse.json({
            "token": jwt,
        });
    } catch (error) {
        if (error === unauthorized) {
            return NextResponse.json(
                { error: 'Invalid credentials.' },
                { status: 401 }
            )

        } else {
            return NextResponse.json(
                { error: 'Something went wrong.' },
                { status: 500 }
            )
        }
    }
}

async function signIn(
    credentials: {
        email: string,
        password: string
    },
): Promise<string> {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.email, credentials.email),
            columns: {
                user_id: true,
                user_role: true,
                password: true
            }
        })
        if (user === undefined) {
            throw unauthorized
        }

        if (!bcrypt.compareSync(credentials.password, user.password)) {
            throw unauthorized
        }

        return Encode({ userId: user.user_id, role: user.user_role! })
    }
    catch (error) {
        throw unauthorized
    }

}