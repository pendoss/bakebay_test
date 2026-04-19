import "dotenv/config";
import bcrypt from "bcryptjs";
import {eq, inArray} from "drizzle-orm";
import {
    db,
    users,
    sellers,
    products,
    productIngredients,
    orders,
    orderItems,
    reviews,
} from "@/src/adapters/storage/drizzle";

export const SELLER_EMAIL = "e2e-seller@bakebay.test";
export const SELLER_PASSWORD = "Test1234!";
export const FOREIGN_SELLER_EMAIL = "e2e-seller-other@bakebay.test";
export const FOREIGN_SELLER_PASSWORD = "Test1234!";

export interface SeedContext {
    sellerUserId: number;
    sellerId: number;
    productAId: number;
    productBId: number;
    ingredientId: number;
    foreignSellerUserId: number;
    foreignSellerId: number;
    foreignProductId: number;
}

let cachedContext: SeedContext | null = null;

const SECRET = Number(process.env.SECRET ?? 10);

async function ensureSellerUser(email: string, firstName: string): Promise<number> {
    const existing = await db.query.users.findFirst({where: eq(users.email, email)});
    if (existing) return existing.user_id;

    const inserted = await db
        .insert(users)
        .values({
            email,
            first_name: firstName,
            last_name: "E2E",
            phone_number: "+70000000000",
            address: "",
            user_role: "seller",
            created_at: new Date(),
            updated_at: new Date(),
            password: bcrypt.hashSync(SELLER_PASSWORD, SECRET),
        })
        .returning();
    return inserted[0].user_id;
}

async function ensureSeller(userId: number, name: string): Promise<number> {
    const existing = await db.query.sellers.findFirst({where: eq(sellers.user_id, userId)});
    if (existing) return existing.seller_id;
    const inserted = await db
        .insert(sellers)
        .values({
            seller_name: name,
            seller_rating: 5,
            description: "E2E seller",
            location: "Moscow",
            contact_name: "E2E",
            contact_email: "e2e@bakebay.test",
            contact_number: "+70000000000",
            user_id: userId,
        })
        .returning();
    return inserted[0].seller_id;
}

async function ensureProduct(
    sellerId: number,
    name: string,
    price: number,
    stock: number
): Promise<number> {
    const existing = await db.query.products.findFirst({where: eq(products.product_name, name)});
    if (existing) return existing.product_id;
    const inserted = await db
        .insert(products)
        .values({
            seller_id: sellerId,
            product_name: name,
            price,
            cost: price / 2,
            short_desc: "E2E product",
            long_desc: "E2E product long description",
            category: "Торты",
            storage_conditions: "+5",
            stock,
            track_inventory: true,
            status: "active",
        })
        .returning();
    return inserted[0].product_id;
}

async function ensureIngredient(productId: number): Promise<number> {
    const existing = await db.query.productIngredients.findFirst({
        where: eq(productIngredients.product_id, productId),
    });
    if (existing) return existing.ingredient_id;
    const inserted = await db
        .insert(productIngredients)
        .values({
            product_id: productId,
            name: "Мука",
            amount: 0.2,
            stock: 5,
            unit: "kg",
            alert: 1,
            status: "ok",
        })
        .returning();
    return inserted[0].ingredient_id;
}

export async function ensureSeedData(): Promise<SeedContext> {
    if (cachedContext) return cachedContext;

    const sellerUserId = await ensureSellerUser(SELLER_EMAIL, "Seller");
    const sellerId = await ensureSeller(sellerUserId, "E2E Bakery");
    const productAId = await ensureProduct(sellerId, "E2E Торт Шоколадный", 1500, 10);
    const productBId = await ensureProduct(sellerId, "E2E Маффин Ванильный", 350, 25);
    const ingredientId = await ensureIngredient(productAId);

    const foreignSellerUserId = await ensureSellerUser(FOREIGN_SELLER_EMAIL, "Other");
    const foreignSellerId = await ensureSeller(foreignSellerUserId, "E2E Other Bakery");
    const foreignProductId = await ensureProduct(foreignSellerId, "E2E Чужой Торт", 999, 5);

    cachedContext = {
        sellerUserId,
        sellerId,
        productAId,
        productBId,
        ingredientId,
        foreignSellerUserId,
        foreignSellerId,
        foreignProductId,
    };
    return cachedContext;
}

export async function getSeedContext(): Promise<SeedContext> {
    return cachedContext ?? (await ensureSeedData());
}

export async function cleanupCreatedRecords(): Promise<void> {
    const allCustomerRows = await db.select({user_id: users.user_id, email: users.email}).from(users);
    const e2eIds = allCustomerRows.filter(r => r.email.startsWith("e2e-customer-")).map(r => r.user_id);

    if (e2eIds.length > 0) {
        const customerOrders = await db
            .select({order_id: orders.order_id, user_id: orders.user_id})
            .from(orders);
        const orderIds = customerOrders.filter(o => o.user_id !== null && e2eIds.includes(o.user_id)).map(o => o.order_id);

        if (orderIds.length > 0) {
            await db.delete(orderItems).where(inArray(orderItems.order_id, orderIds));
            await db.delete(orders).where(inArray(orders.order_id, orderIds));
        }
        await db.delete(reviews).where(inArray(reviews.user_id, e2eIds));
        await db.delete(users).where(inArray(users.user_id, e2eIds));
    }
}
