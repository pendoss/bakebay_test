import {NextResponse} from 'next/server';
import {db, users} from '@/src/db';
import {eq} from 'drizzle-orm';
import {Decode} from '../../jwt';

export async function GET(request: Request) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    try {
        const payload = Decode(token);

        const result = await db
            .select({
                user_id: users.user_id,
                email: users.email,
                first_name: users.first_name,
                last_name: users.last_name,
                user_role: users.user_role,
            })
            .from(users)
            .where(eq(users.user_id, payload.userId));

        const user = result[0];

        if (!user) {
            return NextResponse.json({error: 'User not found'}, {status: 404});
        }

        return NextResponse.json(user);
    } catch {
        return NextResponse.json({error: 'Invalid token'}, {status: 401});
    }
}
