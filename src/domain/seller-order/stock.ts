export type StockLineStatus = 'available' | 'low' | 'missing'

export interface RequiredIngredient {
    readonly key: string
    readonly name: string
    readonly unit: string
    readonly amount: number
}

export interface StockEntry {
    readonly key: string
    readonly available: number
    readonly alertThreshold: number
}

export interface StockLineReport {
    readonly key: string
    readonly name: string
    readonly unit: string
    readonly required: number
    readonly available: number
    readonly status: StockLineStatus
}

export interface StockReport {
    readonly lines: ReadonlyArray<StockLineReport>
    readonly overall: StockLineStatus
}

function lineStatus(required: number, entry: StockEntry | undefined): StockLineStatus {
    if (!entry) return 'missing'
    if (entry.available < required) return 'missing'
    if (entry.available - required < entry.alertThreshold) return 'low'
    return 'available'
}

function severity(status: StockLineStatus): number {
    if (status === 'missing') return 2
    if (status === 'low') return 1
    return 0
}

export function checkIngredientAvailability(
    required: ReadonlyArray<RequiredIngredient>,
    stock: Readonly<Record<string, StockEntry>>,
): StockReport {
    const lines: StockLineReport[] = required.map((req) => {
        const entry = stock[req.key]
        const status = lineStatus(req.amount, entry)
        return {
            key: req.key,
            name: req.name,
            unit: req.unit,
            required: req.amount,
            available: entry?.available ?? 0,
            status,
        }
    })
    const overall = lines.reduce<StockLineStatus>(
        (acc, l) => (severity(l.status) > severity(acc) ? l.status : acc),
        'available',
    )
    return {lines, overall}
}

export function aggregateRequired(
    items: ReadonlyArray<{ quantity: number; ingredients: ReadonlyArray<RequiredIngredient> }>,
): RequiredIngredient[] {
    const map = new Map<string, RequiredIngredient>()
    for (const item of items) {
        for (const ing of item.ingredients) {
            const prev = map.get(ing.key)
            const scaled = ing.amount * item.quantity
            if (prev) {
                map.set(ing.key, {...prev, amount: prev.amount + scaled})
            } else {
                map.set(ing.key, {...ing, amount: scaled})
            }
        }
    }
    return Array.from(map.values())
}
