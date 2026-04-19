import {NextResponse} from 'next/server';
import {db, products, reviews, sellers, users} from '@/src/adapters/storage/drizzle';
import {eq} from 'drizzle-orm';
import {getAuthPayload} from '@/app/api/get-auth';

// GET /api/reviews?sellerId=X  OR  /api/reviews?productId=X
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const sellerId = url.searchParams.get('sellerId');
        const productId = url.searchParams.get('productId');

        if (productId) {
            const rows = await db
                .select({
                    review_id: reviews.review_id,
                    rating: reviews.rating,
                    comment: reviews.comment,
                    created_at: reviews.created_at,
                    user_first_name: users.first_name,
                    user_last_name: users.last_name,
                })
                .from(reviews)
                .leftJoin(users, eq(reviews.user_id, users.user_id))
                .where(eq(reviews.product_id, parseInt(productId)))
                .orderBy(reviews.created_at);

            return NextResponse.json(rows.map(row => ({
                id: row.review_id,
                rating: row.rating,
                comment: row.comment,
                created_at: row.created_at,
                customer: {
                    name: `${row.user_first_name || ''} ${row.user_last_name || ''}`.trim() || 'Аноним',
                },
            })));
        }

        if (!sellerId) {
            return NextResponse.json({error: 'sellerId or productId is required'}, {status: 400});
        }

        const rows = await db
            .select({
                review_id: reviews.review_id,
                rating: reviews.rating,
                comment: reviews.comment,
                seller_reply: reviews.seller_reply,
                reply_date: reviews.reply_date,
                created_at: reviews.created_at,
                product_name: products.product_name,
                user_first_name: users.first_name,
                user_last_name: users.last_name,
            })
            .from(reviews)
            .leftJoin(products, eq(reviews.product_id, products.product_id))
            .leftJoin(users, eq(reviews.user_id, users.user_id))
            .where(eq(reviews.seller_id, parseInt(sellerId)))
            .orderBy(reviews.created_at);

        const formatted = rows.map(row => ({
            id: row.review_id,
            rating: row.rating,
            comment: row.comment,
            seller_reply: row.seller_reply,
            reply_date: row.reply_date,
            created_at: row.created_at,
            product: row.product_name || 'Неизвестный товар',
            customer: {
                name: `${row.user_first_name || ''} ${row.user_last_name || ''}`.trim() || 'Аноним',
                initials: `${(row.user_first_name || 'А')[0]}${(row.user_last_name || 'А')[0]}`.toUpperCase(),
            },
            replied: !!row.seller_reply,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json({error: 'Failed to fetch reviews'}, {status: 500});
    }
}

// POST /api/reviews — create a review (customer)
export async function POST(request: Request) {
    try {
        const authPayload = await getAuthPayload();
        if (!authPayload) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        const userId = authPayload.userId;

        const body = await request.json();
        const {product_id, rating, comment} = body;

        if (!product_id || !rating || !comment) {
            return NextResponse.json({error: 'product_id, rating and comment are required'}, {status: 400});
        }

        // Get seller_id from product
        const product = await db.select({seller_id: products.seller_id}).from(products).where(eq(products.product_id, product_id)).limit(1);
        if (!product.length || !product[0].seller_id) {
            return NextResponse.json({error: 'Product not found'}, {status: 404});
        }

        const now = new Date();
        const newReview = await db.insert(reviews).values({
            product_id,
            user_id: userId,
            seller_id: product[0].seller_id,
            rating: Math.min(5, Math.max(1, parseInt(rating))),
            comment,
            created_at: now,
            updated_at: now,
        }).returning();

        return NextResponse.json(newReview[0]);
    } catch (error) {
        console.error('Error creating review:', error);
        return NextResponse.json({error: 'Failed to create review'}, {status: 500});
    }
}

// PUT /api/reviews — seller replies to a review
export async function PUT(request: Request) {
    try {
        const authPayload = await getAuthPayload();
        if (!authPayload) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        const userId = authPayload.userId;

        const body = await request.json();
        const {review_id, seller_reply} = body;

        if (!review_id || !seller_reply) {
            return NextResponse.json({error: 'review_id and seller_reply are required'}, {status: 400});
        }

        // Verify the seller owns this review
        const sellerRows = await db.select({seller_id: sellers.seller_id}).from(sellers).where(eq(sellers.user_id, userId)).limit(1);
        if (!sellerRows.length) {
            return NextResponse.json({error: 'Seller not found'}, {status: 403});
        }

        const review = await db.select({seller_id: reviews.seller_id}).from(reviews).where(eq(reviews.review_id, review_id)).limit(1);
        if (!review.length || review[0].seller_id !== sellerRows[0].seller_id) {
            return NextResponse.json({error: 'Forbidden'}, {status: 403});
        }

        const now = new Date();
        const updated = await db.update(reviews)
            .set({seller_reply, reply_date: now, updated_at: now})
            .where(eq(reviews.review_id, review_id))
            .returning();

        return NextResponse.json(updated[0]);
    } catch (error) {
        console.error('Error replying to review:', error);
        return NextResponse.json({error: 'Failed to reply to review'}, {status: 500});
    }
}
