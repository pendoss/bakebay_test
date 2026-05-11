import {NextResponse} from 'next/server'
import {eq, asc} from 'drizzle-orm'
import {
    db,
    sellerOrderItems,
    sellerOrders,
    sellerOrderItemOptionSelections,
    productOptionValues,
    productOptionGroups,
    products,
    sellerIngredientLibrary,
    productIngredients,
    sellerStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {asUserId} from '@/src/domain/shared/id'
import {getAuthPayload} from '@/app/api/get-auth'

export async function GET(_request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const {id} = await params
    const itemId = Number(id)
    if (!Number.isFinite(itemId)) return NextResponse.json({error: 'Invalid item id'}, {status: 400})

    const [item] = await db
        .select({
            itemId: sellerOrderItems.seller_order_item_id,
            sellerOrderId: sellerOrderItems.seller_order_id,
            productId: sellerOrderItems.product_id,
            quantity: sellerOrderItems.quantity,
            unitPrice: sellerOrderItems.unit_price,
            productName: products.product_name,
            sellerId: sellerOrders.seller_id,
        })
        .from(sellerOrderItems)
        .innerJoin(sellerOrders, eq(sellerOrderItems.seller_order_id, sellerOrders.seller_order_id))
        .leftJoin(products, eq(sellerOrderItems.product_id, products.product_id))
        .where(eq(sellerOrderItems.seller_order_item_id, itemId))

    if (!item) return NextResponse.json({error: 'Not found'}, {status: 404})

    const seller = await sellerStorageDrizzle().findByUserId(asUserId(auth.userId))
    const viewerIsOwningSeller = seller && (seller.id as unknown as number) === item.sellerId

    const selections = await db
        .select({
            valueId: productOptionValues.product_option_value_id,
            valueLabel: productOptionValues.label,
            valueDelta: productOptionValues.price_delta,
            groupId: productOptionGroups.product_option_group_id,
            groupName: productOptionGroups.name,
            groupKind: productOptionGroups.kind,
        })
        .from(sellerOrderItemOptionSelections)
        .innerJoin(
            productOptionValues,
            eq(sellerOrderItemOptionSelections.option_value_id, productOptionValues.product_option_value_id),
        )
        .innerJoin(
            productOptionGroups,
            eq(productOptionValues.group_id, productOptionGroups.product_option_group_id),
        )
        .where(eq(sellerOrderItemOptionSelections.seller_order_item_id, itemId))
        .orderBy(asc(productOptionGroups.product_option_group_id))

    const recipeIngredients = await db
        .select({
            name: productIngredients.name,
            amount: productIngredients.amount,
            unit: productIngredients.unit,
            isOptional: productIngredients.is_optional,
        })
        .from(productIngredients)
        .where(eq(productIngredients.product_id, item.productId))

    const library = viewerIsOwningSeller
        ? await db
            .select()
            .from(sellerIngredientLibrary)
            .where(eq(sellerIngredientLibrary.seller_id, item.sellerId))
        : []

    return NextResponse.json({
        item: {
            id: item.itemId,
            sellerOrderId: item.sellerOrderId,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
        },
        optionSelections: selections.map((s) => ({
            groupId: s.groupId,
            groupName: s.groupName,
            groupKind: s.groupKind,
            valueId: s.valueId,
            label: s.valueLabel,
            priceDelta: s.valueDelta,
        })),
        recipeIngredients: recipeIngredients.map((r) => ({
            name: r.name,
            amount: r.amount,
            unit: r.unit,
            isOptional: r.isOptional,
        })),
        library: library.map((l) => ({
            id: l.seller_ingredient_id,
            name: l.name,
            unit: l.unit,
            defaultAmount: l.default_amount,
            priceDelta: l.price_delta,
        })),
        viewerIsOwningSeller: !!viewerIsOwningSeller,
    })
}
