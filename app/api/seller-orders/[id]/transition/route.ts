import {NextResponse} from 'next/server'
import {
    customerOrderStorageDrizzle,
    ingredientReservationStorageDrizzle,
    ingredientStorageDrizzle,
    sellerOrderStorageDrizzle,
    sellerStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {advanceSellerOrderStatus, SellerOrderOwnershipError,} from '@/src/application/use-cases/seller-order'
import type {SellerId, UserId} from '@/src/domain/shared/id'
import {asSellerOrderId, asUserId} from '@/src/domain/shared/id'
import {
    InvalidSellerOrderTransitionError,
    SellerOrderNotFoundError,
    type SellerOrderStatus,
} from '@/src/domain/seller-order'
import {getAuthPayload} from '@/app/api/get-auth'
import {dispatchNotification, hasRecentNotification} from '@/app/api/notifications/_dispatch'
import {listIngredientsBySeller} from '@/src/application/use-cases/ingredient'

type IngredientAlertKind = 'ingredient_out' | 'ingredient_low'

async function emitIngredientAlert(
    sellerUserId: UserId,
    kind: IngredientAlertKind,
    ing: { name: string; stock: number; unit: string; alert: number },
    windowHours: number,
) {
    const seen = await hasRecentNotification({
        recipientUserId: sellerUserId,
        kind,
        metaKey: 'ingredientName',
        metaValue: ing.name,
        windowHours,
    })
    if (seen) return

    const isOut = kind === 'ingredient_out'
    await dispatchNotification({
        recipientUserId: sellerUserId,
        kind,
        severity: isOut ? 'error' : 'warning',
        titleMd: isOut ? `**Закончился ингредиент:** ${ing.name}` : `**Мало ингредиента:** ${ing.name}`,
        bodyMd: isOut
            ? `Запас обнулён после списания. Нужна докупка, иначе заказы перейдут в \`preparing_blocked\`.`
            : `Осталось ${ing.stock} ${ing.unit}, порог ${ing.alert} ${ing.unit}.`,
        actions: [
            {
                label: isOut ? 'Перейти к складу' : 'Открыть склад',
                href: '/seller-dashboard/ingredients',
                style: 'primary'
            },
        ],
        meta: {ingredientName: ing.name},
    })
}

async function emitStockAlertsOnReadyToShip(sellerId: SellerId, sellerUserId: UserId) {
    const ingredients = await listIngredientsBySeller(sellerId, {
        ingredientStorage: ingredientStorageDrizzle(),
    })
    const dedupHours = Number(process.env.NOTIFY_INGREDIENT_DEDUP_HOURS ?? 24)
    for (const ing of ingredients.filter((i) => i.status === 'out')) {
        await emitIngredientAlert(sellerUserId, 'ingredient_out', ing, dedupHours)
    }
    for (const ing of ingredients.filter((i) => i.status === 'low')) {
        await emitIngredientAlert(sellerUserId, 'ingredient_low', ing, dedupHours)
    }
}

export async function POST(request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const seller = await sellerStorageDrizzle().findByUserId(asUserId(auth.userId))
    if (!seller) return NextResponse.json({error: 'Seller profile required'}, {status: 403})

    const {id} = await params
    const body = await request.json()
    const next = body?.next as SellerOrderStatus | undefined
    if (!next) return NextResponse.json({error: 'next status required'}, {status: 400})

    try {
        await advanceSellerOrderStatus(
            {
                sellerOrderId: asSellerOrderId(Number(id)),
                actingSellerId: seller.id,
                next,
            },
            {
                sellerOrderStorage: sellerOrderStorageDrizzle(),
                customerOrderStorage: customerOrderStorageDrizzle(),
                stock: {
                    ingredientStorage: ingredientStorageDrizzle(),
                    reservationStorage: ingredientReservationStorageDrizzle(),
                },
            },
        )
        if (next === 'ready_to_ship') {
            await emitStockAlertsOnReadyToShip(seller.id, asUserId(auth.userId))
        }
        return NextResponse.json({ok: true})
    } catch (err) {
        if (err instanceof SellerOrderOwnershipError) {
            return NextResponse.json({error: err.message}, {status: 403})
        }
        if (err instanceof SellerOrderNotFoundError) {
            return NextResponse.json({error: err.message}, {status: 404})
        }
        if (err instanceof InvalidSellerOrderTransitionError) {
            return NextResponse.json({error: err.message}, {status: 409})
        }
        const msg = err instanceof Error ? err.message : 'transition failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
