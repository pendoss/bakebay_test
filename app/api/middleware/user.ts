import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Decode } from '../jwt';


export interface User {
    userId: number;
    role: string;
}


export interface AuthenticatedRequest extends NextRequest {
    user?: User;
}

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default_secret_key_change_in_production'
);


export async function userMiddleware(
    req: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        
        const authenticatedReq = req.clone() as AuthenticatedRequest;
        
        
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            try {
                const payload  = Decode(token)
                authenticatedReq.user = payload as User;
            } catch (error) {
                console.error('Token verification failed:', error);
            }
        }
        
        return handler(authenticatedReq);
    } catch (error) {
        console.error('Middleware error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}


export function getCurrentUser(req: AuthenticatedRequest): User | null {
    return req.user || null;
}


export function isAuthenticated(req: AuthenticatedRequest): boolean {
    return !!req.user;
}

export function isAdmin(req: AuthenticatedRequest): boolean {
    return req.user?.role === 'admin';
}