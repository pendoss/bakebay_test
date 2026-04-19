import {
    aggregateNeeded,
    buildPurchaseList,
    csvRow,
    sumCost,
} from '@/src/domain/optimization'
import type {IngredientSnapshot, OrderSnapshot} from '@/src/domain/optimization'

export interface ExportPurchaseListInput {
    ingredients: IngredientSnapshot[]
    activeOrders: OrderSnapshot[]
}

export function exportPurchaseList(input: ExportPurchaseListInput): string {
    const needed = aggregateNeeded(input.activeOrders)
    const items = buildPurchaseList(input.ingredients, needed)

    const lines: string[] = [
        'Список закупок (активные заказы)',
        '',
        csvRow('Ингредиент', 'Нужно', 'В наличии', 'Докупить', 'Упаковок', 'Цена/уп.', 'Итого'),
    ]

    for (const item of items) {
        const ing = input.ingredients.find((i) => i.name === item.name)
        if (!ing) continue
        const shortfall = Math.max(0, item.needed - item.stock)
        lines.push(csvRow(
            item.name,
            item.needed.toFixed(2),
            item.stock.toFixed(2),
            shortfall.toFixed(2),
            item.packagesToBuy,
            ing.purchasePrice.toFixed(2),
            item.cost.toFixed(2),
        ))
    }
    lines.push(csvRow('ИТОГО', '', '', '', '', '', sumCost(items).toFixed(2)))
    return lines.join('\n')
}
