import { NextRequest, NextResponse } from 'next/server';
import { Decode } from '../jwt';


export interface User {
    userId: number;
    role: string;
}


export interface AuthenticatedRequest extends NextRequest {
    user?: User;
}


export async function userMiddleware(
    req: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
    try {

        const authenticatedReq = req.clone() as AuthenticatedRequest;


        const token = req.headers.get('Authorization')?.replace('Bearer ', '');

        if (token) {
            try {
                const payload = Decode(token)
                authenticatedReq.user = payload as User;
            } catch (error) {
                console.error('Token verification failed:', error);
            }
        }

        return handler(authenticatedReq);
    } catch (error) {
        console.error('Middleware error:', error);
        return NextResponse.json(
            {error: 'Internal Server Error'},
            {status: 500}
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

export function isSeller(req: AuthenticatedRequest): boolean {
    return req.user?.role === 'seller'
}