import {eq} from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import {
    db,
    users,
    sellers,
    categories,
    products,
    productIngredients,
    productOptionGroups,
    productOptionValues,
    sellerIngredientLibrary,
    customerOrders,
    sellerOrders,
    sellerOrderItems,
    customizationThreads,
    customizationOffers,
    customizationMessages,
    sellerOrderIngredientReservations,
} from '@/src/adapters/storage/drizzle'

export interface UserSpec {
    email: string
    firstName?: string
    lastName?: string
    password?: string
    role?: 'customer' | 'seller' | 'admin'
    phone?: string
    address?: string
}

export interface SellerSpec {
    name: string
    userEmail: string
    commissionRate?: number
    description?: string
    location?: string
    contactEmail?: string
}

export interface OptionGroupSpec {
    name: string
    kind?: 'size' | 'color' | 'flavor' | 'custom'
    required?: boolean
    values: Array<{ label: string; priceDelta?: number }>
}

export interface IngredientSpec {
    name: string
    unit: string
    amount: number
    stock?: number
    alert?: number
    optional?: boolean
    purchasePrice?: number
    purchaseQty?: number
}

export interface ProductSpec {
    sellerName: string
    name: string
    price: number
    cost?: number
    category?: string
    shortDesc?: string
    longDesc?: string
    storageConditions?: string
    stock?: number
    isCustomizable?: boolean
    ingredients?: IngredientSpec[]
    optionGroups?: OptionGroupSpec[]
}

export interface CreatedUser {
    userId: number
    email: string
}

export interface CreatedSeller {
    sellerId: number
    userId: number
    name: string
}

export interface CreatedProduct {
    productId: number
    sellerId: number
    name: string
}

async function ensureCategory(name: string): Promise<number> {
    const existing = await db.select().from(categories).where(eq(categories.name, name))
    if (existing.length > 0) return existing[0].id
    const [row] = await db.insert(categories).values({name}).returning({id: categories.id})
    return row.id
}

export async function createUser(spec: UserSpec): Promise<CreatedUser> {
    const existing = await db.select().from(users).where(eq(users.email, spec.email))
    if (existing.length > 0) {
        return {userId: existing[0].user_id, email: existing[0].email}
    }
    const password = await bcrypt.hash(spec.password ?? 'password123', 10)
    const now = new Date()
    const [row] = await db
        .insert(users)
        .values({
            email: spec.email,
            first_name: spec.firstName ?? 'Test',
            last_name: spec.lastName ?? 'User',
            phone_number: spec.phone ?? '+70000000000',
            address: spec.address ?? '',
            user_role: spec.role ?? 'customer',
            created_at: now,
            updated_at: now,
            password,
        })
        .returning({user_id: users.user_id, email: users.email})
    return {userId: row.user_id, email: row.email}
}

export async function createSeller(spec: SellerSpec): Promise<CreatedSeller> {
    const user = await db.select().from(users).where(eq(users.email, spec.userEmail))
    if (user.length === 0) throw new Error(`Seller user ${spec.userEmail} not found — create the user first`)
    const userId = user[0].user_id

    const existing = await db.select().from(sellers).where(eq(sellers.user_id, userId))
    if (existing.length > 0) {
        return {sellerId: existing[0].seller_id, userId, name: existing[0].seller_name}
    }
    const [row] = await db
        .insert(sellers)
        .values({
            seller_name: spec.name,
            description: spec.description ?? `${spec.name} — test seller`,
            location: spec.location ?? 'Moscow',
            contact_name: spec.name,
            contact_email: spec.contactEmail ?? spec.userEmail,
            contact_number: '+70000000000',
            user_id: userId,
            commission_rate: spec.commissionRate ?? 0.1,
        })
        .returning({seller_id: sellers.seller_id, seller_name: sellers.seller_name})
    return {sellerId: row.seller_id, userId, name: row.seller_name}
}

export async function createProduct(spec: ProductSpec): Promise<CreatedProduct> {
    const seller = await db.select().from(sellers).where(eq(sellers.seller_name, spec.sellerName))
    if (seller.length === 0) throw new Error(`Seller ${spec.sellerName} not found`)
    const sellerId = seller[0].seller_id
    const categoryId = await ensureCategory(spec.category ?? 'general')

    const [row] = await db
        .insert(products)
        .values({
            seller_id: sellerId,
            product_name: spec.name,
            price: spec.price,
            cost: spec.cost ?? spec.price * 0.6,
            short_desc: spec.shortDesc ?? spec.name,
            long_desc: spec.longDesc ?? spec.name,
            category: spec.category ?? 'general',
            category_id: categoryId,
            storage_conditions: spec.storageConditions ?? 'normal',
            stock: spec.stock ?? 10,
            is_customizable: spec.isCustomizable ?? false,
        })
        .returning({
            product_id: products.product_id,
            seller_id: products.seller_id,
            product_name: products.product_name
        })

    const productId = row.product_id

    if (spec.ingredients && spec.ingredients.length > 0) {
        await db.insert(productIngredients).values(
            spec.ingredients.map((ing) => ({
                product_id: productId,
                name: ing.name,
                amount: ing.amount,
                stock: ing.stock ?? 0,
                unit: ing.unit,
                alert: ing.alert ?? 0,
                is_optional: ing.optional ?? false,
                purchase_price: ing.purchasePrice ?? 0,
                purchase_qty: ing.purchaseQty ?? 1,
            })),
        )
    }

    if (spec.optionGroups) {
        for (const group of spec.optionGroups) {
            const [g] = await db
                .insert(productOptionGroups)
                .values({
                    product_id: productId,
                    name: group.name,
                    kind: group.kind ?? 'custom',
                    is_required: group.required ? 1 : 0,
                })
                .returning({product_option_group_id: productOptionGroups.product_option_group_id})
            await db.insert(productOptionValues).values(
                group.values.map((v) => ({
                    group_id: g.product_option_group_id,
                    label: v.label,
                    price_delta: v.priceDelta ?? 0,
                })),
            )
        }
    }

    return {productId, sellerId, name: row.product_name}
}

export async function addSellerLibraryIngredient(params: {
    sellerName: string
    name: string
    unit: string
    defaultAmount: number
    priceDelta?: number
}): Promise<void> {
    const seller = await db.select().from(sellers).where(eq(sellers.seller_name, params.sellerName))
    if (seller.length === 0) throw new Error(`Seller ${params.sellerName} not found`)
    await db.insert(sellerIngredientLibrary).values({
        seller_id: seller[0].seller_id,
        name: params.name,
        unit: params.unit,
        default_amount: params.defaultAmount,
        price_delta: params.priceDelta ?? 0,
    })
}

export async function resetTestData(emailPrefix: string): Promise<void> {
    const targetUsers = await db
        .select({user_id: users.user_id})
        .from(users)
        .where(eq(users.user_role, 'customer'))
    const userIds = targetUsers
        .filter((u) => u.user_id)
        .map((u) => u.user_id)
    if (userIds.length === 0) return
    await db.delete(sellerOrderIngredientReservations)
    await db.delete(customizationMessages)
    await db.delete(customizationOffers)
    await db.delete(customizationThreads)
    await db.delete(sellerOrderItems)
    await db.delete(sellerOrders)
    await db.delete(customerOrders)
    await db.delete(productOptionValues)
    await db.delete(productOptionGroups)
    await db.delete(productIngredients)
    await db.delete(sellerIngredientLibrary)
    await db.delete(products)
    await db.delete(sellers)
    console.log(`[reset] wiped dependent data for emailPrefix=${emailPrefix}`)
}
