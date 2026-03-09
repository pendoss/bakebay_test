import {NextResponse} from 'next/server';
import {db, users} from '@/src/db';
import {eq} from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import {Decode} from '../../jwt';

export async function PUT(request: Request) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({error: 'Unauthorized'}, {status: 401});

    try {
        const payload = Decode(token);
        const body: { currentPassword: string; newPassword: string } = await request.json();

        const result = await db
            .select({password: users.password})
            .from(users)
            .where(eq(users.user_id, payload.userId));

        const user = result[0];
        if (!user) return NextResponse.json({error: 'User not found'}, {status: 404});

        const isValid = bcrypt.compareSync(body.currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json({error: 'Неверный текущий пароль'}, {status: 400});
        }

        const hashed = bcrypt.hashSync(body.newPassword, Number(process.env.SECRET));
        await db
            .update(users)
            .set({password: hashed, updated_at: new Date()})
            .where(eq(users.user_id, payload.userId));

        return NextResponse.json({success: true});
    } catch {
        return NextResponse.json({error: 'Failed to update password'}, {status: 500});
    }
}
