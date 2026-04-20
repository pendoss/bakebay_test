import {NextResponse} from 'next/server'
import {
    customerOrderStorageDrizzle,
    ingredientReservationStorageDrizzle,
    ingredientStorageDrizzle,
    sellerOrderStorageDrizzle,
    sellerStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {
    advanceSellerOrderStatus,
    SellerOrderOwnershipError,
} from '@/src/application/use-cases/seller-order'
import {asSellerOrderId, asUserId} from '@/src/domain/shared/id'
import {
    InvalidSellerOrderTransitionError,
    SellerOrderNotFoundError,
    type SellerOrderStatus,
} from '@/src/domain/seller-order'
import {getAuthPayload} from '@/app/api/get-auth'
import {dispatchNotification, hasRecentNotification} from '@/app/api/notifications/_dispatch'
import {listIngredientsBySeller} from '@/src/application/use-cases/ingredient'

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
            const ingredients = await listIngredientsBySeller(seller.id, {
                ingredientStorage: ingredientStorageDrizzle(),
            })
            const sellerUserId = asUserId(auth.userId)
            const dedupHours = Number(process.env.NOTIFY_INGREDIENT_DEDUP_HOURS ?? 24)
            const out = ingredients.filter((ing) => ing.status === 'out')
            const low = ingredients.filter((ing) => ing.status === 'low')
            for (const ing of out) {
                const seen = await hasRecentNotification({
                    recipientUserId: sellerUserId,
                    kind: 'ingredient_out',
                    metaKey: 'ingredientName',
                    metaValue: ing.name,
                    windowHours: dedupHours,
                })
                if (seen) continue
                await dispatchNotification({
                    recipientUserId: sellerUserId,
                    kind: 'ingredient_out',
                    severity: 'error',
                    titleMd: `**Закончился ингредиент:** ${ing.name}`,
                    bodyMd: `Запас обнулён после списания. Нужна докупка, иначе заказы перейдут в \`preparing_blocked\`.`,
                    actions: [
                        {label: 'Перейти к складу', href: '/seller-dashboard/ingredients', style: 'primary'},
                    ],
                    meta: {ingredientName: ing.name},
                })
            }
            for (const ing of low) {
                const seen = await hasRecentNotification({
                    recipientUserId: sellerUserId,
                    kind: 'ingredient_low',
                    metaKey: 'ingredientName',
                    metaValue: ing.name,
                    windowHours: dedupHours,
                })
                if (seen) continue
                await dispatchNotification({
                    recipientUserId: sellerUserId,
                    kind: 'ingredient_low',
                    severity: 'warning',
                    titleMd: `**Мало ингредиента:** ${ing.name}`,
                    bodyMd: `Осталось ${ing.stock} ${ing.unit}, порог ${ing.alert} ${ing.unit}.`,
                    actions: [
                        {label: 'Открыть склад', href: '/seller-dashboard/ingredients', style: 'primary'},
                    ],
                    meta: {ingredientName: ing.name},
                })
            }
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
