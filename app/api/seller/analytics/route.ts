import { NextResponse } from 'next/server';
import { eq, inArray, desc } from 'drizzle-orm';
import {db, orders, orderItems, products, reviews, users} from '@/src/adapters/storage/drizzle';

const MONTH_NAMES = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

const EMPTY_RESPONSE = {
    kpis: {
        total_revenue: 0, orders_count: 0, unique_customers: 0,
        avg_order_value: 0, avg_rating: 0, products_count: 0,
        revenue_change: 0, orders_change: 0,
    },
    monthly_data: [] as { name: string; revenue: number; orders: number }[],
    top_products: [] as { name: string; quantity: number; revenue: number }[],
    recent_orders: [] as object[],
    recent_reviews: [] as object[],
};

export async function GET(request: Request) {
    const url = new URL(request.url);
    const sellerId = url.searchParams.get('sellerId');

    if (!sellerId) {
        return NextResponse.json({error: 'Seller ID is required'}, {status: 400});
    }

    const sellerIdNum = parseInt(sellerId);

    // 1. Seller's products
    const sellerProducts = await db.select({
        product_id: products.product_id,
        product_name: products.product_name,
        price: products.price,
    }).from(products).where(eq(products.seller_id, sellerIdNum));

    if (sellerProducts.length === 0) {
        return NextResponse.json({...EMPTY_RESPONSE, kpis: {...EMPTY_RESPONSE.kpis, products_count: 0}});
    }

    const productIds = sellerProducts.map(p => p.product_id) as number[];

    // 2. Order items for seller's products
    const sellerItems = await db.select({
        order_id: orderItems.order_id,
        product_id: orderItems.product_id,
        quantity: orderItems.quantity,
    }).from(orderItems).where(inArray(orderItems.product_id, productIds));

    const orderIds = [...new Set(sellerItems.map(i => i.order_id).filter(Boolean))] as number[];

    // 3. Orders
    const sellerOrders = orderIds.length > 0
        ? await db.select({
            order_id: orders.order_id,
            date: orders.date,
            order_status: orders.order_status,
            user_id: orders.user_id,
        }).from(orders).where(inArray(orders.order_id, orderIds))
        : [];

    // Helper: revenue for a single order
    const orderRevenue = (orderId: number) =>
        sellerItems
            .filter(i => i.order_id === orderId)
            .reduce((sum, i) => {
                const p = sellerProducts.find(p => p.product_id === i.product_id);
                return sum + (p?.price ?? 0) * i.quantity;
            }, 0);

    // 4. KPIs
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let totalRevenue = 0, curRevenue = 0, prevRevenue = 0;
    let curOrders = 0, prevOrders = 0;
    const uniqueCustomers = new Set<number>();

    for (const order of sellerOrders) {
        const rev = orderRevenue(order.order_id);
        const d = new Date(order.date);
        totalRevenue += rev;
        if (order.user_id) uniqueCustomers.add(order.user_id);
        if (d >= currentMonthStart) {
            curRevenue += rev;
            curOrders++;
        } else if (d >= prevMonthStart) {
            prevRevenue += rev;
            prevOrders++;
        }
    }

    const pct = (cur: number, prev: number) =>
        prev > 0 ? parseFloat(((cur - prev) / prev * 100).toFixed(1)) : cur > 0 ? 100 : 0;

    // 5. Monthly data (last 12 months)
    const monthlyMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyMap.set(`${d.getFullYear()}-${d.getMonth()}`, {revenue: 0, orders: 0});
    }
    for (const order of sellerOrders) {
        const d = new Date(order.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const entry = monthlyMap.get(key);
        if (entry) {
            entry.revenue += orderRevenue(order.order_id);
            entry.orders += 1;
        }
    }
    const monthly_data = Array.from(monthlyMap.entries()).map(([key, v]) => ({
        name: MONTH_NAMES[parseInt(key.split('-')[1])],
        revenue: Math.round(v.revenue),
        orders: v.orders,
    }));

    // 6. Top 5 products by revenue
    const productStats = new Map<number, { name: string; quantity: number; revenue: number }>();
    for (const item of sellerItems) {
        if (!item.product_id) continue;
        const p = sellerProducts.find(p => p.product_id === item.product_id);
        if (!p) continue;
        const s = productStats.get(item.product_id) ?? {name: p.product_name ?? '', quantity: 0, revenue: 0};
        s.quantity += item.quantity;
        s.revenue += (p.price ?? 0) * item.quantity;
        productStats.set(item.product_id, s);
    }
    const top_products = Array.from(productStats.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(p => ({...p, revenue: Math.round(p.revenue)}));

    // 7. Recent orders (last 5) with customer names
    const sortedOrders = [...sellerOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recent_orders = await Promise.all(sortedOrders.slice(0, 5).map(async order => {
        let customer = 'Гость';
        if (order.user_id) {
            const u = await db.select({first_name: users.first_name, last_name: users.last_name})
                .from(users).where(eq(users.user_id, order.user_id));
            if (u[0]) customer = `${u[0].first_name} ${u[0].last_name}`;
        }
        const items = sellerItems.filter(i => i.order_id === order.order_id);
        return {
            id: order.order_id.toString(),
            date: new Date(order.date).toISOString(),
            status: order.order_status,
            customer,
            items_count: items.reduce((s, i) => s + i.quantity, 0),
            total: Math.round(orderRevenue(order.order_id)),
        };
    }));

    // 8. Reviews — avg rating + last 3
    const allReviews = await db.select({
        review_id: reviews.review_id,
        rating: reviews.rating,
        comment: reviews.comment,
        created_at: reviews.created_at,
        user_id: reviews.user_id,
        product_id: reviews.product_id,
    }).from(reviews).where(eq(reviews.seller_id, sellerIdNum)).orderBy(desc(reviews.created_at));

    const avg_rating = allReviews.length > 0
        ? parseFloat((allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1))
        : 0;

    const recent_reviews = await Promise.all(allReviews.slice(0, 3).map(async r => {
        const u = r.user_id
            ? await db.select({first_name: users.first_name, last_name: users.last_name})
                .from(users).where(eq(users.user_id, r.user_id))
            : [];
        const p = r.product_id
            ? await db.select({product_name: products.product_name})
                .from(products).where(eq(products.product_id, r.product_id))
            : [];
        return {
            review_id: r.review_id,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
            customer: u[0] ? `${u[0].first_name} ${u[0].last_name}` : 'Аноним',
            product: p[0]?.product_name ?? 'Товар',
        };
    }));

    return NextResponse.json({
        kpis: {
            total_revenue: Math.round(totalRevenue),
            orders_count: sellerOrders.length,
            unique_customers: uniqueCustomers.size,
            avg_order_value: sellerOrders.length > 0 ? Math.round(totalRevenue / sellerOrders.length) : 0,
            avg_rating,
            products_count: sellerProducts.length,
            revenue_change: pct(curRevenue, prevRevenue),
            orders_change: pct(curOrders, prevOrders),
        },
        monthly_data,
        top_products,
        recent_orders,
        recent_reviews,
    });
}
