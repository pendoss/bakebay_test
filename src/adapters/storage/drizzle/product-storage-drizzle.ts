import {eq, count, sql} from 'drizzle-orm'
import {
    db,
    products as productsTable,
    sellers,
    categories,
    dietaryConstrains,
    productImages,
    productIngredients,
} from '@/src/adapters/storage/drizzle'
import type {
    ProductStorage,
    ProductListFilters,
    ProductImageInput,
    ProductUpdateInput,
} from '@/src/application/ports/product-storage'
import type {
    Product,
    ProductDraft,
    ProductIngredient,
    ProductSearchMatch,
    ProductSearchResult
} from '@/src/domain/product'
import type {ProductId, SellerId} from '@/src/domain/shared/id'
import {asProductId} from '@/src/domain/shared/id'
import {rowsToProduct} from './mappers/product'

async function loadImages(productId: number) {
    return db
        .select()
        .from(productImages)
        .where(eq(productImages.product_id, productId))
        .orderBy(productImages.is_main, productImages.display_order)
}

async function loadDietary(productId: number): Promise<string[]> {
    const rows = await db
        .select({name: dietaryConstrains.name})
        .from(dietaryConstrains)
        .where(eq(dietaryConstrains.product_id, productId))
    return rows.map((r) => r.name)
}

export function productStorageDrizzle(): ProductStorage {
    return {
        async findById(id: ProductId): Promise<Product | null> {
            const product = await db.query.products.findFirst({
                where: eq(productsTable.product_id, id),
            })
            if (!product) return null
            const [images, dietary] = await Promise.all([loadImages(id), loadDietary(id)])
            return rowsToProduct({product, images, dietary})
        },

        async list(filters: ProductListFilters): Promise<Product[]> {
            const where = filters.categoryName
                ? eq(productsTable.category, filters.categoryName)
                : filters.sellerId
                    ? eq(productsTable.seller_id, filters.sellerId)
                    : undefined
            const rows = await db
                .select()
                .from(productsTable)
                .where(where)
                .leftJoin(sellers, eq(productsTable.seller_id, sellers.seller_id))
                .leftJoin(categories, eq(productsTable.category_id, categories.id))

            return Promise.all(
                rows.map(async (row) => {
                    const [images, dietary] = await Promise.all([
                        loadImages(row.products.product_id),
                        loadDietary(row.products.product_id),
                    ])
                    return rowsToProduct({
                        product: row.products,
                        images,
                        dietary,
                        seller: row.sellers,
                        category: row.categories,
                    })
                }),
            )
        },

        async search(query: string, limit = 20): Promise<ProductSearchResult> {
            const normalized = query.trim().toLowerCase()
            if (normalized.length === 0) {
                return {query: normalized, results: [], suggestions: []}
            }

            const rows = await db.execute<{
                product_id: number
                seller_id: number | null
                product_name: string
                price: number
                cost: number | null
                short_desc: string
                long_desc: string
                category: string
                storage_conditions: string
                stock: number | null
                category_id: number | null
                sku: string | null
                weight: number | null
                size: string | null
                shelf_life: number | null
                track_inventory: boolean | null
                low_stock_alert: boolean | null
                status: string | null
                is_customizable: boolean
                score: number
                seller_id_out: number | null
                seller_name_out: string | null
                seller_rating_out: number | null
                category_id_out: number | null
                category_name_out: string | null
            }>(sql`
                SELECT
                    p.*,
                    greatest(
                        similarity(lower(p.product_name), ${normalized}),
                        similarity(lower(coalesce(p.short_desc, '')), ${normalized}) * 0.5
                    ) AS score,
                    s.seller_id AS seller_id_out,
                    s.seller_name AS seller_name_out,
                    s.seller_rating AS seller_rating_out,
                    c.id AS category_id_out,
                    c.name AS category_name_out
                FROM products p
                LEFT JOIN sellers s ON s.seller_id = p.seller_id
                LEFT JOIN categories c ON c.id = p.category_id
                WHERE
                    lower(p.product_name) % ${normalized}
                    OR lower(coalesce(p.short_desc, '')) % ${normalized}
                    OR lower(p.product_name) ILIKE ${'%' + normalized + '%'}
                ORDER BY score DESC
                LIMIT ${limit}
            `)
            const rowsArr = (rows as unknown as { rows?: unknown[] }).rows ?? (rows as unknown as unknown[])
            const typedRows = rowsArr as Array<{
                product_id: number
                seller_id: number | null
                product_name: string
                price: number
                cost: number | null
                short_desc: string
                long_desc: string
                category: string
                storage_conditions: string
                stock: number | null
                category_id: number | null
                sku: string | null
                weight: number | null
                size: string | null
                shelf_life: number | null
                track_inventory: boolean | null
                low_stock_alert: boolean | null
                status: string | null
                is_customizable: boolean
                score: number
                seller_id_out: number | null
                seller_name_out: string | null
                seller_rating_out: number | null
                category_id_out: number | null
                category_name_out: string | null
            }>

            const buildMatches = async (list: typeof typedRows): Promise<ProductSearchMatch[]> =>
                Promise.all(
                    list.map(async (row) => {
                        const [images, dietary] = await Promise.all([
                            loadImages(row.product_id),
                            loadDietary(row.product_id),
                        ])
                        const product = rowsToProduct({
                            product: row,
                            images,
                            dietary,
                            seller: row.seller_id_out !== null
                                ? {
                                    seller_id: row.seller_id_out,
                                    seller_name: row.seller_name_out ?? '',
                                    seller_rating: row.seller_rating_out,
                                }
                                : null,
                            category: row.category_id_out !== null
                                ? {id: row.category_id_out, name: row.category_name_out ?? ''}
                                : null,
                        })
                        return {product, score: Number(row.score ?? 0)}
                    }),
                )

            const strong = typedRows.filter((r) => Number(r.score) > 0.2)
            const weak = typedRows.filter((r) => Number(r.score) > 0.1 && Number(r.score) <= 0.2)

            const results = await buildMatches(strong)
            const suggestions = results.length < 3 ? await buildMatches(weak.slice(0, 5)) : []

            return {query: normalized, results, suggestions}
        },

        async listBySeller(sellerId: SellerId): Promise<Product[]> {
            const rows = await db
                .select()
                .from(productsTable)
                .where(eq(productsTable.seller_id, sellerId))
            return Promise.all(
                rows.map(async (product) => {
                    const [images, dietary] = await Promise.all([loadImages(product.product_id), loadDietary(product.product_id)])
                    return rowsToProduct({product, images, dietary})
                }),
            )
        },

        async countBySeller(sellerId: SellerId): Promise<number> {
            const result = await db
                .select({counter: count()})
                .from(productsTable)
                .where(eq(productsTable.seller_id, sellerId))
            return result[0]?.counter ?? 0
        },

        async create(draft: ProductDraft): Promise<ProductId> {
            const [row] = await db
                .insert(productsTable)
                .values({
                    seller_id: draft.sellerId,
                    product_name: draft.name,
                    price: draft.price,
                    cost: draft.cost ?? 0,
                    short_desc: draft.shortDesc,
                    long_desc: draft.longDesc,
                    category: draft.category,
                    storage_conditions: draft.storageConditions,
                    stock: draft.stock ?? 0,
                    category_id: draft.categoryId ?? null,
                    sku: draft.sku ?? '',
                    weight: draft.weight ?? 0,
                    size: draft.size ?? '',
                    shelf_life: draft.shelfLife ?? 0,
                    track_inventory: draft.trackInventory ?? true,
                    low_stock_alert: draft.lowStockAlert ?? false,
                    status: draft.status ?? 'active',
                })
                .returning({product_id: productsTable.product_id})
            return asProductId(row.product_id)
        },

        async update(input: ProductUpdateInput): Promise<boolean> {
            const updated = await db
                .update(productsTable)
                .set({
                    product_name: input.name,
                    price: input.price,
                    cost: input.cost ?? undefined,
                    short_desc: input.shortDesc,
                    long_desc: input.longDesc,
                    category: input.category,
                    storage_conditions: input.storageConditions,
                    stock: input.stock,
                    sku: input.sku ?? undefined,
                    weight: input.weight ?? undefined,
                    size: input.size ?? undefined,
                    shelf_life: input.shelfLife ?? undefined,
                    status: input.status,
                })
                .where(eq(productsTable.product_id, input.id))
                .returning({product_id: productsTable.product_id})
            return updated.length > 0
        },

        async delete(id: ProductId): Promise<boolean> {
            const deleted = await db
                .delete(productsTable)
                .where(eq(productsTable.product_id, id))
                .returning({product_id: productsTable.product_id})
            return deleted.length > 0
        },

        async replaceDietary(id: ProductId, dietary: string[]): Promise<void> {
            await db.delete(dietaryConstrains).where(eq(dietaryConstrains.product_id, id))
            if (dietary.length === 0) return
            await db.insert(dietaryConstrains).values(dietary.map((name) => ({name, product_id: id})))
        },

        async replaceIngredients(id: ProductId, ingredients: ProductIngredient[]): Promise<void> {
            await db.delete(productIngredients).where(eq(productIngredients.product_id, id))
            if (ingredients.length === 0) return
            await db.insert(productIngredients).values(
                ingredients.map((i) => ({
                    product_id: id,
                    name: i.name,
                    amount: i.amount,
                    unit: i.unit,
                    stock: 0,
                })),
            )
        },

        async replaceImages(id: ProductId, images: ProductImageInput[]): Promise<void> {
            await db.delete(productImages).where(eq(productImages.product_id, id))
            if (images.length === 0) return
            await db.insert(productImages).values(
                images.map((i) => ({
                    product_id: id,
                    image_url: i.url,
                    name: i.name,
                    is_main: i.isMain,
                    display_order: i.displayOrder,
                    s3_key: i.s3Key,
                })),
            )
        },
    }
}
