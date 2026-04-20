import {NextResponse} from 'next/server'
import {asc, eq} from 'drizzle-orm'
import {db, productOptionGroups, productOptionValues} from '@/src/adapters/storage/drizzle'

export async function GET(_request: Request, {params}: { params: Promise<{ id: string }> }) {
    const {id} = await params
    const productId = Number(id)
    if (!Number.isFinite(productId)) {
        return NextResponse.json({error: 'Invalid product id'}, {status: 400})
    }

    const groups = await db
        .select()
        .from(productOptionGroups)
        .where(eq(productOptionGroups.product_id, productId))
        .orderBy(asc(productOptionGroups.product_option_group_id))

    if (groups.length === 0) return NextResponse.json({groups: []})

    const groupIds = groups.map((g) => g.product_option_group_id)
    const values = await db.select().from(productOptionValues)
    const byGroup = new Map<number, typeof values>()
    for (const v of values) {
        if (!groupIds.includes(v.group_id)) continue
        const list = byGroup.get(v.group_id) ?? []
        list.push(v)
        byGroup.set(v.group_id, list)
    }

    return NextResponse.json({
        groups: groups.map((g) => ({
            id: g.product_option_group_id,
            name: g.name,
            kind: g.kind,
            required: g.is_required === 1,
            values: (byGroup.get(g.product_option_group_id) ?? [])
                .sort((a, b) => a.product_option_value_id - b.product_option_value_id)
                .map((v) => ({
                    id: v.product_option_value_id,
                    label: v.label,
                    priceDelta: v.price_delta,
                })),
        })),
    })
}
