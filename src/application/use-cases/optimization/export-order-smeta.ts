import {csvRow, ingredientPricePerUnit} from '@/src/domain/optimization'
import type {OrderSnapshot} from '@/src/domain/optimization'

export interface OrderIngredientPricing {
    name: string
    purchasePrice: number
    purchaseQty: number
    unit: string
}

export interface ExportOrderSmetaInput {
    orderId: number
    order: OrderSnapshot | null
    pricing: OrderIngredientPricing[]
}

export function exportOrderSmeta(input: ExportOrderSmetaInput): string {
    if (!input.order) return ''

    const priceByIng: Record<string, number> = {}
    for (const p of input.pricing) {
        if (!priceByIng[p.name]) {
            priceByIng[p.name] = ingredientPricePerUnit(p.purchasePrice, p.purchaseQty)
        }
    }

    const lines: string[] = [
        `Смета по заказу #${input.orderId}`,
        '',
        csvRow('Продукт', 'Кол-во', 'Ингредиент', 'Расход', 'Ед.', 'Цена/ед.', 'Сумма'),
    ]

    let orderTotal = 0
    for (const item of input.order.items) {
        let productTotal = 0
        const qty = item.quantity || 1
        for (const ing of item.ingredients) {
            const totalAmount = ing.amount * qty
            const pricePerUnit = priceByIng[ing.name] ?? 0
            const lineTotal = totalAmount * pricePerUnit
            productTotal += lineTotal
            lines.push(csvRow(item.name, qty, ing.name, totalAmount.toFixed(2), ing.unit, pricePerUnit.toFixed(2), lineTotal.toFixed(2)))
        }
        orderTotal += productTotal
        lines.push(csvRow('', '', `ИТОГО по "${item.name}"`, '', '', '', productTotal.toFixed(2)))
    }
    lines.push(csvRow('ИТОГО по заказу', '', '', '', '', '', orderTotal.toFixed(2)))
    return lines.join('\n')
}
