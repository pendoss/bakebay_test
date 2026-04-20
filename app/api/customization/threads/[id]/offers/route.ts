import {NextResponse} from 'next/server'
import {
    customerOrderStorageDrizzle,
    customizationStorageDrizzle,
    db,
    sellerIngredientLibrary,
    sellerOrderStorageDrizzle,
    sellerStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {asCustomizationThreadId, asUserId} from '@/src/domain/shared/id'
import {submitCustomizationOffer} from '@/src/application/use-cases/customization'
import {syncSellerOrderFromThreadEvent} from '@/src/application/use-cases/seller-order'
import {CustomizationThreadClosedError} from '@/src/domain/customization'
import {getAuthPayload} from '@/app/api/get-auth'
import {resolveSellerOrderByThread} from '@/app/api/customization/_lookup'

export async function POST(request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    const seller = await sellerStorageDrizzle().findByUserId(asUserId(auth.userId))
    if (!seller) return NextResponse.json({error: 'Only sellers can submit offers'}, {status: 403})

    const {id} = await params
    const body = await request.json()
    const priceDelta = Number(body?.priceDelta ?? 0)
    const spec = body?.spec ?? {optionSelections: [], customIngredients: [], sellerNotes: '', customerNotes: ''}

    try {
        const customIngredients = Array.isArray(spec?.customIngredients) ? spec.customIngredients : []
        const toLibrary = customIngredients.filter(
            (ing: { saveToLibrary?: boolean; name?: string; unit?: string }) =>
                ing.saveToLibrary && typeof ing.name === 'string' && ing.name.trim().length > 0,
        )
        if (toLibrary.length > 0) {
            await db.insert(sellerIngredientLibrary).values(
                toLibrary.map(
                    (ing: {
                        name: string
                        unit?: string
                        amount?: number
                        priceDelta?: number
                    }) => ({
                        seller_id: seller.id as unknown as number,
                        name: ing.name.trim(),
                        unit: (ing.unit ?? 'шт').trim() || 'шт',
                        default_amount: Number(ing.amount) || 0,
                        price_delta: Number(ing.priceDelta) || 0,
                    }),
                ),
            )
        }

        await submitCustomizationOffer(
            {
                threadId: asCustomizationThreadId(Number(id)),
                spec,
                priceDelta,
            },
            {customizationStorage: customizationStorageDrizzle()},
        )
        const sellerOrderId = await resolveSellerOrderByThread(Number(id))
        if (sellerOrderId !== null) {
            await syncSellerOrderFromThreadEvent(sellerOrderId, 'seller-offer', {
                sellerOrderStorage: sellerOrderStorageDrizzle(),
                customerOrderStorage: customerOrderStorageDrizzle(),
            })
        }
        return NextResponse.json({ok: true})
    } catch (err) {
        if (err instanceof CustomizationThreadClosedError) {
            return NextResponse.json({error: err.message}, {status: 409})
        }
        const msg = err instanceof Error ? err.message : 'offer failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
