import {NextResponse} from 'next/server';
import {db, products} from '@/src/db';
import {eq, count} from 'drizzle-orm';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const sellerId = url.searchParams.get('sellerId');

    if (!sellerId) {
        return NextResponse.json({error: 'Missing sellerId'}, {status: 400});
    }

    try {
        const result = await db
            .select({counter: count()})
            .from(products)
            .where(eq(products.seller_id, parseInt(sellerId)));

        return NextResponse.json({count: result[0]?.counter ?? 0});
    } catch {
        return NextResponse.json({error: 'Failed to count products'}, {status: 500});
    }
}
