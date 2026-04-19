import {csvRow, ingredientPricePerUnit} from '@/src/domain/optimization'

export interface ProductSmetaIngredient {
    name: string
    amount: number
    unit: string
    purchasePrice: number
    purchaseQty: number
}

export interface ExportProductSmetaInput {
    productName: string | null
    price: number
    ingredients: ProductSmetaIngredient[]
}

export function exportProductSmeta(input: ExportProductSmetaInput): string {
    if (!input.productName) return ''
    const lines: string[] = [
        `Смета по продукту: ${input.productName}`,
        '',
        csvRow('Ингредиент', 'Расход на 1 ед.', 'Ед.', 'Цена за ед.', 'Стоимость'),
    ]

    let costPerUnit = 0
    for (const ing of input.ingredients) {
        const pricePerUnit = ingredientPricePerUnit(ing.purchasePrice, ing.purchaseQty)
        const lineTotal = ing.amount * pricePerUnit
        costPerUnit += lineTotal
        lines.push(csvRow(ing.name, ing.amount.toFixed(2), ing.unit, pricePerUnit.toFixed(2), lineTotal.toFixed(2)))
    }

    const margin = input.price - costPerUnit
    lines.push(csvRow('СЕБЕСТОИМОСТЬ', '', '', '', costPerUnit.toFixed(2)))
    lines.push(csvRow('Цена продажи', '', '', '', input.price.toFixed(2)))
    lines.push(csvRow('Маржа', '', '', '', margin.toFixed(2)))
    return lines.join('\n')
}
