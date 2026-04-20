import {and, eq, sql} from 'drizzle-orm'
import {db, productIngredients} from '@/src/adapters/storage/drizzle'
import type {
    IngredientStorage,
    IngredientUpdate,
    RawStockEntry,
} from '@/src/application/ports/ingredient-storage'
import type {Ingredient, StockStatus} from '@/src/domain/ingredient'
import type {RequiredIngredient} from '@/src/domain/seller-order'
import type {IngredientId, ProductId, SellerId, SellerOrderId} from '@/src/domain/shared/id'
import {asIngredientId, asProductId} from '@/src/domain/shared/id'

interface IngredientRow {
    ingredient_id: number
    product_id: number | null
    name: string
    amount: number
    stock: number | null
    unit: string
    alert: number | null
    status: StockStatus | null
    purchase_qty: number | null
    purchase_price: number | null
}

function rowToIngredient(row: IngredientRow): Ingredient {
    const stock = row.stock ?? 0
    const alert = row.alert ?? 0
    return {
        id: asIngredientId(row.ingredient_id),
        productId: row.product_id !== null ? asProductId(row.product_id) : null,
        name: row.name,
        unit: row.unit,
        amount: row.amount,
        stock,
        alert,
        status: (row.status ?? (stock <= 0 ? 'out' : stock <= alert ? 'low' : 'ok')),
        purchaseQty: row.purchase_qty ?? 1,
        purchasePrice: row.purchase_price ?? 0,
    }
}

export function ingredientStorageDrizzle(): IngredientStorage {
    return {
        async listBySeller(sellerId: SellerId): Promise<Ingredient[]> {
            const res = await db.execute(sql`
				WITH first_per_ingredient AS (
					SELECT MIN(pi.ingredient_id) AS ingredient_id
					FROM product_ingredients pi
					JOIN products p ON pi.product_id = p.product_id
					WHERE p.seller_id = ${sellerId as unknown as number}
					GROUP BY pi.name
				)
				SELECT pi.ingredient_id, pi.product_id, pi.name, pi.amount, pi.stock, pi.unit,
				       pi.alert, pi.status, pi.purchase_qty, pi.purchase_price
				FROM product_ingredients pi
				JOIN first_per_ingredient fpi ON pi.ingredient_id = fpi.ingredient_id
				ORDER BY pi.name
			`)
            return (res.rows as unknown as IngredientRow[]).map(rowToIngredient)
        },

        async listByProduct(productId: ProductId): Promise<Ingredient[]> {
            const rows = await db
                .select()
                .from(productIngredients)
                .where(eq(productIngredients.product_id, productId as unknown as number))
            return rows.map((r) => rowToIngredient(r as unknown as IngredientRow))
        },

        async findByNameAndProduct(name: string, productId: ProductId): Promise<Ingredient | null> {
            const rows = await db
                .select()
                .from(productIngredients)
                .where(and(eq(productIngredients.name, name), eq(productIngredients.product_id, productId as unknown as number)))
                .limit(1)
            if (rows.length === 0) return null
            return rowToIngredient(rows[0] as unknown as IngredientRow)
        },

        async updateById(id: IngredientId, patch: IngredientUpdate): Promise<void> {
            const values: Record<string, unknown> = {stock: patch.stock, status: patch.status}
            if (patch.unit !== undefined) values.unit = patch.unit
            if (patch.alert !== undefined) values.alert = patch.alert
            await db
                .update(productIngredients)
                .set(values)
                .where(eq(productIngredients.ingredient_id, id as unknown as number))
        },

        async updateByName(name: string, patch: IngredientUpdate): Promise<void> {
            const values: Record<string, unknown> = {stock: patch.stock, status: patch.status}
            if (patch.unit !== undefined) values.unit = patch.unit
            if (patch.alert !== undefined) values.alert = patch.alert
            await db.update(productIngredients).set(values).where(eq(productIngredients.name, name))
        },

        async getStockByKeys(
            sellerId: SellerId,
            keys: ReadonlyArray<string>,
        ): Promise<Record<string, RawStockEntry>> {
            if (keys.length === 0) return {}
            const res = await db.execute(sql`
                SELECT pi.name,
                       MAX(COALESCE(pi.stock, 0)) AS stock,
                       MAX(COALESCE(pi.alert, 0)) AS alert
                FROM product_ingredients pi
                JOIN products p ON pi.product_id = p.product_id
                WHERE p.seller_id = ${sellerId as unknown as number}
                  AND pi.name = ANY(${keys as string[]})
                GROUP BY pi.name
            `)
            const out: Record<string, RawStockEntry> = {}
            for (const row of res.rows as Array<{name: string; stock: number; alert: number}>) {
                out[row.name] = {stock: Number(row.stock), alertThreshold: Number(row.alert)}
            }
            return out
        },

        async getRequiredForSellerOrder(sellerOrderId: SellerOrderId): Promise<RequiredIngredient[]> {
            const res = await db.execute(sql`
                SELECT pi.name, pi.unit, SUM(pi.amount * soi.quantity) AS total
                FROM seller_order_items soi
                JOIN product_ingredients pi ON pi.product_id = soi.product_id
                WHERE soi.seller_order_id = ${sellerOrderId as unknown as number}
                  AND pi.is_optional = false
                GROUP BY pi.name, pi.unit
            `)
            return (res.rows as Array<{name: string; unit: string; total: number}>).map((r) => ({
                key: r.name,
                name: r.name,
                unit: r.unit,
                amount: Number(r.total),
            }))
        },

        async decrementStockByKey(sellerId: SellerId, key: string, amount: number): Promise<void> {
            await db.execute(sql`
                UPDATE product_ingredients pi
                SET stock = GREATEST(0, COALESCE(pi.stock, 0) - ${amount}),
                    status = CASE
                        WHEN GREATEST(0, COALESCE(pi.stock, 0) - ${amount}) <= 0 THEN 'out'
                        WHEN GREATEST(0, COALESCE(pi.stock, 0) - ${amount}) <= COALESCE(pi.alert, 0) THEN 'low'
                        ELSE 'ok'
                    END
                FROM products p
                WHERE pi.product_id = p.product_id
                  AND p.seller_id = ${sellerId as unknown as number}
                  AND pi.name = ${key}
            `)
        },
    }
}
