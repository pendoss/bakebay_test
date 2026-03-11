import { cookies } from 'next/headers';
import { Decode } from './jwt';

export interface AuthPayload {
    userId: number;
    role: string;
}

export async function getAuthPayload(): Promise<AuthPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        return Decode(token);
    } catch {
        return null;
    }
}

export function setAuthCookie(response: Response, token: string): void {
    response.headers.set(
        'Set-Cookie',
        `auth_token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    );
}
