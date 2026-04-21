import {
    addSellerLibraryIngredient,
    createProduct,
    createSeller,
    createUser,
} from './factories'

export async function seedBaselineScenario(): Promise<void> {
    await createUser({email: 'customer1@test.local', firstName: 'Alice', lastName: 'Customer', role: 'customer'})
    await createUser({email: 'customer2@test.local', firstName: 'Bob', lastName: 'Customer', role: 'customer'})

    await createUser({email: 'seller-alpha@test.local', firstName: 'Alpha', lastName: 'Baker', role: 'seller'})
    await createUser({email: 'seller-beta@test.local', firstName: 'Beta', lastName: 'Baker', role: 'seller'})

    await createSeller({name: 'Alpha Bakery', userEmail: 'seller-alpha@test.local', commissionRate: 0.1})
    await createSeller({name: 'Beta Patisserie', userEmail: 'seller-beta@test.local', commissionRate: 0.15})

    await createProduct({
        sellerName: 'Alpha Bakery',
        name: 'Honey cake (non-custom)',
        price: 1200,
        category: 'cake',
        stock: 20,
        isCustomizable: false,
        ingredients: [
            {name: 'Flour', unit: 'g', amount: 300, stock: 5000, alert: 500},
            {name: 'Honey', unit: 'g', amount: 150, stock: 1200, alert: 200},
            {name: 'Eggs', unit: 'pcs', amount: 4, stock: 200, alert: 20},
        ],
    })

    await createProduct({
        sellerName: 'Alpha Bakery',
        name: 'Croissant',
        price: 180,
        category: 'pastry',
        stock: 50,
        isCustomizable: false,
        ingredients: [
            {name: 'Flour', unit: 'g', amount: 80, stock: 5000, alert: 500},
            {name: 'Butter', unit: 'g', amount: 50, stock: 1500, alert: 300},
        ],
    })

    await createProduct({
        sellerName: 'Beta Patisserie',
        name: 'Custom tiered cake',
        price: 5000,
        category: 'cake',
        stock: 1,
        isCustomizable: true,
        ingredients: [
            {name: 'Flour', unit: 'g', amount: 600, stock: 3000, alert: 500},
            {name: 'Cocoa', unit: 'g', amount: 200, stock: 800, alert: 100},
            {name: 'Food coloring', unit: 'ml', amount: 10, stock: 200, alert: 50, optional: true},
        ],
        optionGroups: [
            {
                name: 'Size',
                kind: 'size',
                required: true,
                values: [
                    {label: '1 kg', priceDelta: 0},
                    {label: '2 kg', priceDelta: 1500},
                    {label: '3 kg', priceDelta: 3000},
                ],
            },
            {
                name: 'Frosting color',
                kind: 'color',
                required: false,
                values: [
                    {label: 'white', priceDelta: 0},
                    {label: 'pink', priceDelta: 200},
                    {label: 'blue', priceDelta: 200},
                ],
            },
        ],
    })

    await createProduct({
        sellerName: 'Alpha Bakery',
        name: 'Birthday cake (small)',
        price: 2500,
        category: 'cake',
        stock: 5,
        isCustomizable: true,
        ingredients: [
            {name: 'Flour', unit: 'g', amount: 400, stock: 5000, alert: 500},
            {name: 'Sugar', unit: 'g', amount: 250, stock: 4000, alert: 300},
            {name: 'Berries', unit: 'g', amount: 100, stock: 600, alert: 100, optional: true},
        ],
        optionGroups: [
            {
                name: 'Вкус',
                kind: 'flavor',
                required: true,
                values: [
                    {label: 'Ваниль', priceDelta: 0},
                    {label: 'Шоколад', priceDelta: 150},
                    {label: 'Карамель', priceDelta: 200},
                ],
            },
            {
                name: 'Надпись на торте',
                kind: 'custom',
                required: false,
                values: [
                    {label: 'Без надписи', priceDelta: 0},
                    {label: 'С именем (до 15 символов)', priceDelta: 300},
                ],
            },
        ],
    })

    await createProduct({
        sellerName: 'Beta Patisserie',
        name: 'Свадебный торт',
        price: 12000,
        category: 'cake',
        stock: 1,
        isCustomizable: true,
        ingredients: [
            {name: 'Flour', unit: 'g', amount: 1500, stock: 3000, alert: 500},
            {name: 'Cream', unit: 'g', amount: 800, stock: 2000, alert: 400},
            {name: 'Edible gold leaf', unit: 'sheet', amount: 2, stock: 10, alert: 2, optional: true},
        ],
        optionGroups: [
            {
                name: 'Количество ярусов',
                kind: 'size',
                required: true,
                values: [
                    {label: '2 яруса', priceDelta: 0},
                    {label: '3 яруса', priceDelta: 4000},
                    {label: '4 яруса', priceDelta: 8000},
                ],
            },
            {
                name: 'Стиль',
                kind: 'custom',
                required: true,
                values: [
                    {label: 'Классический', priceDelta: 0},
                    {label: 'Рустик', priceDelta: 500},
                    {label: 'Минимализм', priceDelta: 1000},
                ],
            },
            {
                name: 'Декор',
                kind: 'custom',
                required: false,
                values: [
                    {label: 'Без декора', priceDelta: 0},
                    {label: 'Живые цветы', priceDelta: 1200},
                    {label: 'Съедобное золото', priceDelta: 2000},
                ],
            },
        ],
    })

    await createProduct({
        sellerName: 'Beta Patisserie',
        name: 'Stock-tight eclair',
        price: 300,
        category: 'pastry',
        stock: 3,
        isCustomizable: false,
        ingredients: [
            {name: 'Pistachio paste', unit: 'g', amount: 40, stock: 50, alert: 30},
        ],
    })

    await addSellerLibraryIngredient({
        sellerName: 'Beta Patisserie',
        name: 'Edible gold leaf',
        unit: 'sheet',
        defaultAmount: 1,
        priceDelta: 800,
    })
    await addSellerLibraryIngredient({
        sellerName: 'Beta Patisserie',
        name: 'Sugar pearls',
        unit: 'g',
        defaultAmount: 10,
        priceDelta: 150,
    })

    console.log('[seed] baseline scenario created')
}
