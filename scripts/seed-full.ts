/**
 * Полный сидинг тестовых данных для проверки всех функций приложения.
 *
 * Создаёт:
 *  - 7 кондитеров (чтобы появился seller_id=7) + покупателей
 *  - 10 заявленных товаров для Кондитер_1 (с реальными картинками из S3)
 *  - набор товаров для Кондитер_7 с теми же изображениями
 *  - категории, диетические ограничения, ингредиенты, опции кастомизации
 *  - библиотеку ингредиентов для Кондитер_7
 *  - заказы во всех ключевых статусах (для seller_id=7)
 *  - треды кастомизации с офферами и сообщениями
 *  - уведомления разных типов для пользователя Кондитера_7
 *  - отзывы на товары
 *
 * Запуск:  pnpm tsx scripts/seed-full.ts [--reset]
 */

import 'dotenv/config'
import {eq} from 'drizzle-orm'
import bcrypt from 'bcryptjs'

import {
    categories,
    customerOrders,
    customizationMessages,
    customizationOffers,
    customizationThreads,
    db,
    dietaryConstrains,
    notifications,
    orderItems,
    orders,
    productImages,
    productIngredients,
    productOptionGroups,
    productOptionValues,
    products,
    reviews,
    sellerIngredientLibrary,
    sellerOrderIngredientReservations,
    sellerOrderItemOptionSelections,
    sellerOrderItems,
    sellerOrders,
    sellers,
    users,
} from '@/src/adapters/storage/drizzle'

const S3 = 'https://s3.diploma.larek.tech/bakebay'

interface ProductSeed {
    id: number              // исходный id из заявки (используется только для s3-ключа картинки)
    name: string
    price: number
    short_desc: string
    long_desc: string
    category: string
    storage_conditions: string
    shelf_life: number
    size: string
    stock: number
    dietary: string[]
    is_customizable: boolean
}

const SELLER1_PRODUCTS: ProductSeed[] = [
    {
        id: 31,
        name: 'Медовая пахлава',
        price: 800,
        short_desc: 'Ярчайший вкус медовый пахлавы по традиционным восточным рецептам',
        long_desc: 'Ярчайший вкус медовый пахлавы по традиционным восточным рецептам',
        category: 'Выпечка',
        storage_conditions: '',
        shelf_life: 0,
        size: 'medium',
        stock: 1,
        dietary: ['Содержит орехи'],
        is_customizable: false
    },
    {
        id: 32,
        name: 'Шоколадный брауни',
        price: 780,
        short_desc: 'Первый веганский шоколадный брауни',
        long_desc: 'Первый веганский шоколадный брауни, который сочетает в себе всё самое полезное и вкусное! Насыщенный вкус шоколада, тающий во рту.',
        category: 'Шоколад',
        storage_conditions: '',
        shelf_life: 0,
        size: 'small',
        stock: 3,
        dietary: ['Веганское', 'Без молочных продуктов'],
        is_customizable: false
    },
    {
        id: 35,
        name: 'Синнабон',
        price: 1300,
        short_desc: 'Нежнейшие булочки синнабон',
        long_desc: 'Нежнейшие булочки синнабон, которые покорят сердце любого!',
        category: 'Выпечка',
        storage_conditions: '',
        shelf_life: 0,
        size: 'large',
        stock: 2,
        dietary: ['Содержит молочные продукты'],
        is_customizable: false
    },
    {
        id: 33,
        name: 'Фруктовый тарт',
        price: 500,
        short_desc: 'Отличный десерт для любого события!',
        long_desc: 'Отличный десерт для любого события!',
        category: 'Печенье',
        storage_conditions: '',
        shelf_life: 0,
        size: 'small',
        stock: 5,
        dietary: ['Может содержать орехи', 'Содержит молочные продукты'],
        is_customizable: false
    },
    {
        id: 29,
        name: 'Капкейки "Красный бархат"',
        price: 1600,
        short_desc: 'Нежные капкейки по традиционному американскому рецепту',
        long_desc: 'Нежные капкейки по традиционному американскому рецепту теста "красный бархат".',
        category: 'Капкейки',
        storage_conditions: 'Хранить в холодильнике',
        shelf_life: 4,
        size: '',
        stock: 2,
        dietary: ['Может содержать орехи', 'Содержит молочные продукты'],
        is_customizable: false
    },
    {
        id: 34,
        name: 'Тирамису в стаканчике',
        price: 900,
        short_desc: 'Изысканный вкус тирамису',
        long_desc: 'Изысканный вкус тирамису, приготовленный по традиционному рецепту.',
        category: 'Итальянские десерты',
        storage_conditions: '',
        shelf_life: 0,
        size: 'small',
        stock: 4,
        dietary: ['Содержит молочные продукты', 'Содержит орехи'],
        is_customizable: false
    },
    {
        id: 36,
        name: 'Ассорти макарун',
        price: 2500,
        short_desc: 'Французский десерт макарун',
        long_desc: 'Всеми известный французский десерт — макарун. За уши не оттянешь.',
        category: 'Выпечка',
        storage_conditions: '',
        shelf_life: 0,
        size: 'small',
        stock: 1,
        dietary: ['Содержит молочные продукты', 'Может содержать орехи'],
        is_customizable: false
    },
    {
        id: 30,
        name: 'Лимонный пирог с безе',
        price: 2000,
        short_desc: 'Нежнейший лимонный пирог с безе',
        long_desc: 'Нежнейший лимонный пирог с безе с лёгкой кислинкой.',
        category: 'Выпечка',
        storage_conditions: 'Хранить в холодильнике',
        shelf_life: 3,
        size: 'medium',
        stock: 1,
        dietary: ['Содержит молочные продукты'],
        is_customizable: false
    },
    {
        id: 38,
        name: 'Шоколадный торт',
        price: 3500,
        short_desc: 'Насыщенный шоколадный торт',
        long_desc: 'Шоколадный торт, который унесёт вас в мир детства и фантазии.',
        category: 'Торты',
        storage_conditions: '',
        shelf_life: 0,
        size: '',
        stock: 1,
        dietary: ['Содержит молочные продукты'],
        is_customizable: true
    },
    {
        id: 37,
        name: 'Клубничный чизкейк',
        price: 2750,
        short_desc: 'Нежный сливочный чизкейк с клубникой',
        long_desc: 'Нежный сливочный вкус чизкейка в сочетании с ярким и сладким вкусом клубники.',
        category: 'Торты',
        storage_conditions: '',
        shelf_life: 0,
        size: 'large',
        stock: 0,
        dietary: ['Содержит молочные продукты'],
        is_customizable: true
    },
]

// Часть товаров — у кондитера_7. Используем те же S3-ключи для картинок (мок),
// чтобы все экраны рендерили реальные изображения.
const SELLER7_PRODUCTS: Array<ProductSeed & { imageKey: string }> = [
    {
        id: 101,
        name: 'Авторский торт "Наполеон"',
        price: 4200,
        short_desc: 'Классика, переосмысленная шефом',
        long_desc: 'Многослойный Наполеон с заварным кремом и щепоткой ванили из Мадагаскара.',
        category: 'Торты',
        storage_conditions: 'Хранить в холодильнике',
        shelf_life: 3,
        size: 'large',
        stock: 2,
        dietary: ['Содержит молочные продукты'],
        is_customizable: true,
        imageKey: '38_0'
    },
    {
        id: 102,
        name: 'Лимонные мадлен',
        price: 950,
        short_desc: 'Французские пирожные с цедрой лимона',
        long_desc: 'Воздушные мадлен по семейному рецепту с лимонной цедрой.',
        category: 'Печенье',
        storage_conditions: '',
        shelf_life: 7,
        size: 'small',
        stock: 12,
        dietary: ['Содержит молочные продукты'],
        is_customizable: false,
        imageKey: '33_0'
    },
    {
        id: 103,
        name: 'Эклер фисташковый',
        price: 420,
        short_desc: 'Эклер с кремом из фисташковой пасты',
        long_desc: 'Хрустящее заварное тесто и нежный фисташковый крем.',
        category: 'Выпечка',
        storage_conditions: 'Хранить в холодильнике',
        shelf_life: 2,
        size: 'small',
        stock: 8,
        dietary: ['Содержит молочные продукты', 'Содержит орехи'],
        is_customizable: false,
        imageKey: '36_0'
    },
    {
        id: 104,
        name: 'Свадебный торт на заказ',
        price: 15000,
        short_desc: 'Многоярусный торт под ваше торжество',
        long_desc: 'Многоярусный торт с авторским декором и индивидуальным вкусом.',
        category: 'Торты',
        storage_conditions: 'Хранить в холодильнике',
        shelf_life: 2,
        size: 'large',
        stock: 1,
        dietary: ['Содержит молочные продукты'],
        is_customizable: true,
        imageKey: '37_0'
    },
    {
        id: 105,
        name: 'Капкейки ассорти 6 шт',
        price: 1800,
        short_desc: 'Набор из 6 капкейков на ваш выбор',
        long_desc: 'Шесть капкейков разных вкусов. Выберите сами или доверьтесь шефу.',
        category: 'Капкейки',
        storage_conditions: 'Хранить в холодильнике',
        shelf_life: 3,
        size: 'medium',
        stock: 4,
        dietary: ['Содержит молочные продукты'],
        is_customizable: true,
        imageKey: '29_0'
    },
    {
        id: 106,
        name: 'Брауни без сахара',
        price: 690,
        short_desc: 'Веганский брауни без сахара',
        long_desc: 'Шоколадный брауни на финиковом сиропе, без сахара и молочных продуктов.',
        category: 'Шоколад',
        storage_conditions: '',
        shelf_life: 5,
        size: 'small',
        stock: 6,
        dietary: ['Веганское', 'Без молочных продуктов', 'Без сахара'],
        is_customizable: false,
        imageKey: '32_0'
    },
]

async function ensureUser(spec: {
    email: string; firstName: string; lastName: string;
    role: 'customer' | 'seller'; phone?: string; address?: string
}): Promise<number> {
    const found = await db.select().from(users).where(eq(users.email, spec.email))
    if (found.length > 0) return found[0].user_id
    const password = await bcrypt.hash('password123', 10)
    const now = new Date()
    const [row] = await db.insert(users).values({
        email: spec.email,
        first_name: spec.firstName,
        last_name: spec.lastName,
        phone_number: spec.phone ?? '+70000000000',
        address: spec.address ?? 'Москва, ул. Тестовая, 1',
        user_role: spec.role,
        created_at: now,
        updated_at: now,
        password,
    }).returning({user_id: users.user_id})
    return row.user_id
}

async function ensureSeller(spec: {
    name: string; userId: number; rating?: number; description?: string;
    imageUrl?: string; aboutProducts?: string; location?: string;
}): Promise<number> {
    const found = await db.select().from(sellers).where(eq(sellers.user_id, spec.userId))
    if (found.length > 0) return found[0].seller_id
    const [row] = await db.insert(sellers).values({
        seller_name: spec.name,
        seller_rating: spec.rating ?? 5,
        description: spec.description ?? `${spec.name} — авторская кондитерская`,
        location: spec.location ?? 'Москва',
        contact_name: spec.name,
        contact_email: `${spec.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}@test.local`,
        contact_number: '+70000000000',
        about_products: spec.aboutProducts ?? 'Торты, капкейки, авторские десерты на заказ',
        image_url: spec.imageUrl ?? `${S3}/38_0`,
        user_id: spec.userId,
        commission_rate: 0.1,
    }).returning({seller_id: sellers.seller_id})
    return row.seller_id
}

async function ensureCategory(name: string): Promise<number> {
    const found = await db.select().from(categories).where(eq(categories.name, name))
    if (found.length > 0) return found[0].id
    const [row] = await db.insert(categories).values({name}).returning({id: categories.id})
    return row.id
}

async function createProduct(opts: {
    seed: ProductSeed
    sellerId: number
    imageKey: string
    imageName: string
}): Promise<number> {
    const {seed, sellerId, imageKey, imageName} = opts
    const catId = await ensureCategory(seed.category)
    const [row] = await db.insert(products).values({
        seller_id: sellerId,
        product_name: seed.name,
        price: seed.price,
        cost: Math.round(seed.price * 0.55),
        short_desc: seed.short_desc,
        long_desc: seed.long_desc,
        category: seed.category,
        category_id: catId,
        storage_conditions: seed.storage_conditions || 'Обычные условия',
        stock: seed.stock,
        size: seed.size || undefined,
        shelf_life: seed.shelf_life || undefined,
        is_customizable: seed.is_customizable,
        status: 'active',
        track_inventory: true,
        low_stock_alert: seed.stock <= 1,
    }).returning({product_id: products.product_id})

    const productId = row.product_id

    await db.insert(productImages).values({
        product_id: productId,
        image_url: `${S3}/${imageKey}`,
        name: imageName,
        is_main: true,
        display_order: 0,
        s3_key: imageKey,
    })

    if (seed.dietary.length > 0) {
        await db.insert(dietaryConstrains).values(
            seed.dietary.map((name) => ({name, product_id: productId})),
        )
    }

    // базовый набор ингредиентов
    await db.insert(productIngredients).values([
        {
            product_id: productId,
            name: 'Мука',
            amount: 200,
            stock: 5000,
            unit: 'г',
            alert: 500,
            status: 'ok',
            purchase_qty: 1000,
            purchase_price: 80,
            is_optional: false
        },
        {
            product_id: productId,
            name: 'Сахар',
            amount: 150,
            stock: 3000,
            unit: 'г',
            alert: 300,
            status: 'ok',
            purchase_qty: 1000,
            purchase_price: 60,
            is_optional: false
        },
        {
            product_id: productId,
            name: 'Сливочное масло',
            amount: 100,
            stock: 800,
            unit: 'г',
            alert: 200,
            status: 'low',
            purchase_qty: 500,
            purchase_price: 250,
            is_optional: false
        },
    ])

    if (seed.is_customizable) {
        const [sizeGroup] = await db.insert(productOptionGroups).values({
            product_id: productId, name: 'Размер', kind: 'size', is_required: 1,
        }).returning({product_option_group_id: productOptionGroups.product_option_group_id})
        await db.insert(productOptionValues).values([
            {group_id: sizeGroup.product_option_group_id, label: '1 кг', price_delta: 0},
            {group_id: sizeGroup.product_option_group_id, label: '2 кг', price_delta: 1500},
            {group_id: sizeGroup.product_option_group_id, label: '3 кг', price_delta: 3000},
        ])
        const [flavorGroup] = await db.insert(productOptionGroups).values({
            product_id: productId, name: 'Вкус', kind: 'flavor', is_required: 0,
        }).returning({product_option_group_id: productOptionGroups.product_option_group_id})
        await db.insert(productOptionValues).values([
            {group_id: flavorGroup.product_option_group_id, label: 'Классический', price_delta: 0},
            {group_id: flavorGroup.product_option_group_id, label: 'Шоколадный', price_delta: 200},
            {group_id: flavorGroup.product_option_group_id, label: 'Карамельный', price_delta: 300},
        ])
    }

    return productId
}

async function clearAll(): Promise<void> {
    console.log('[seed-full] reset: чистим зависимые таблицы')
    await db.delete(notifications)
    await db.delete(sellerOrderIngredientReservations)
    await db.delete(sellerOrderItemOptionSelections)
    await db.delete(customizationMessages)
    await db.delete(customizationOffers)
    await db.delete(sellerOrderItems)
    await db.delete(sellerOrders)
    await db.delete(customerOrders)
    await db.delete(customizationThreads)
    await db.delete(reviews)
    await db.delete(orderItems)
    await db.delete(orders)
    await db.delete(productOptionValues)
    await db.delete(productOptionGroups)
    await db.delete(productIngredients)
    await db.delete(dietaryConstrains)
    await db.delete(productImages)
    await db.delete(sellerIngredientLibrary)
    await db.delete(products)
    await db.delete(sellers)
    // users оставляем, чтобы не потерять стартовые аккаунты — но почистим только тестовых
}

async function main(): Promise<void> {
    const shouldReset = process.argv.includes('--reset')
    if (shouldReset) await clearAll()

    console.log('[seed-full] users + sellers...')
    // 7 кондитеров — чтобы появился seller_id=7. Заполняем все карточки витрины.
    const sellerMeta: Array<{ rating: number; image: string; about: string; location: string; desc: string }> = [
        {
            rating: 4.9,
            image: `${S3}/38_0`,
            about: 'Авторские торты, выпечка, восточные сладости',
            location: 'Москва',
            desc: 'Кондитерская «Кондитер_1». Большой ассортимент и быстрая доставка.'
        },
        {
            rating: 4.7,
            image: `${S3}/35_0`,
            about: 'Французская выпечка, синнабоны, эклеры',
            location: 'Санкт-Петербург',
            desc: 'Семейная пекарня — каждый день свежая выпечка.'
        },
        {
            rating: 4.8,
            image: `${S3}/30_0`,
            about: 'Сезонные пироги и тарты',
            location: 'Казань',
            desc: 'Готовим из локальных фермерских продуктов.'
        },
        {
            rating: 4.5,
            image: `${S3}/34_0`,
            about: 'Итальянские десерты, тирамису, панна-котта',
            location: 'Москва',
            desc: 'Десерты в стаканчиках для офисов и мероприятий.'
        },
        {
            rating: 4.6,
            image: `${S3}/29_0`,
            about: 'Капкейки, маффины, мини-десерты',
            location: 'Москва',
            desc: 'Маленькие десерты для больших праздников.'
        },
        {
            rating: 4.4,
            image: `${S3}/32_0`,
            about: 'Веганские и безглютеновые сладости',
            location: 'Москва',
            desc: 'Без сахара, без молочки, без компромиссов.'
        },
        {
            rating: 5.0,
            image: `${S3}/37_0`,
            about: 'Авторские свадебные торты на заказ',
            location: 'Москва',
            desc: 'Кондитер_7 — премиальные торты с индивидуальной кастомизацией.'
        },
    ]
    const sellerIds: number[] = []
    for (let i = 1; i <= 7; i++) {
        const uid = await ensureUser({
            email: `seller${i}@test.local`,
            firstName: `Кондитер`,
            lastName: `№${i}`,
            role: 'seller',
        })
        const m = sellerMeta[i - 1]
        const sid = await ensureSeller({
            name: `Кондитер_${i}`,
            userId: uid,
            rating: m.rating,
            description: m.desc,
            imageUrl: m.image,
            aboutProducts: m.about,
            location: m.location,
        })
        sellerIds.push(sid)
    }
    const seller1Id = sellerIds[0]
    const seller7Id = sellerIds[6]
    const seller7UserId = (await db.select().from(sellers).where(eq(sellers.seller_id, seller7Id)))[0].user_id!

    // покупатели
    const customer1Id = await ensureUser({
        email: 'customer1@test.local',
        firstName: 'Анна',
        lastName: 'Покупатель',
        role: 'customer'
    })
    const customer2Id = await ensureUser({
        email: 'customer2@test.local',
        firstName: 'Борис',
        lastName: 'Покупатель',
        role: 'customer'
    })
    const customer3Id = await ensureUser({
        email: 'customer3@test.local',
        firstName: 'Виктория',
        lastName: 'Гость',
        role: 'customer'
    })

    console.log('[seed-full] products for seller_1 (10 заявленных)...')
    const seller1ProductIds: Record<number, number> = {}
    for (const seed of SELLER1_PRODUCTS) {
        const imageKey = `${seed.id}_0`
        const pid = await createProduct({
            seed,
            sellerId: seller1Id,
            imageKey,
            imageName: `IMG_${seed.id}.JPG`,
        })
        seller1ProductIds[seed.id] = pid
    }

    console.log(`[seed-full] products for seller_7 (seller_id=${seller7Id})...`)
    const seller7ProductIds: number[] = []
    for (const seed of SELLER7_PRODUCTS) {
        const pid = await createProduct({
            seed,
            sellerId: seller7Id,
            imageKey: seed.imageKey,
            imageName: `IMG_${seed.id}.JPG`,
        })
        seller7ProductIds.push(pid)
    }

    console.log('[seed-full] products for sellers 2..6 (для каталога и /sellers)...')
    // По одному-два товара каждому из остальных кондитеров — берём из существующих сидов
    const extraDistribution: Array<{ sellerIndex: number; seeds: ProductSeed[]; imageKey: string }> = [
        {sellerIndex: 1, seeds: [SELLER1_PRODUCTS[2]], imageKey: '35_0'},  // Синнабон → Кондитер_2
        {sellerIndex: 2, seeds: [SELLER1_PRODUCTS[7]], imageKey: '30_0'},  // Лимонный пирог → Кондитер_3
        {sellerIndex: 3, seeds: [SELLER1_PRODUCTS[5]], imageKey: '34_0'},  // Тирамису → Кондитер_4
        {sellerIndex: 4, seeds: [SELLER1_PRODUCTS[4]], imageKey: '29_0'},  // Капкейки → Кондитер_5
        {sellerIndex: 5, seeds: [SELLER1_PRODUCTS[1]], imageKey: '32_0'},  // Брауни → Кондитер_6
    ]
    for (const {sellerIndex, seeds, imageKey} of extraDistribution) {
        for (const seed of seeds) {
            await createProduct({
                seed: {...seed, name: `${seed.name} (${`Кондитер_${sellerIndex + 1}`})`},
                sellerId: sellerIds[sellerIndex],
                imageKey,
                imageName: `IMG_${imageKey}.JPG`,
            })
        }
    }

    console.log('[seed-full] seller_7 ingredient library...')
    await db.insert(sellerIngredientLibrary).values([
        {seller_id: seller7Id, name: 'Съедобное золото (лист)', unit: 'лист', default_amount: 1, price_delta: 800},
        {seller_id: seller7Id, name: 'Сахарный жемчуг', unit: 'г', default_amount: 10, price_delta: 150},
        {seller_id: seller7Id, name: 'Живые цветы (декор)', unit: 'шт', default_amount: 3, price_delta: 1200},
        {seller_id: seller7Id, name: 'Кандурин', unit: 'г', default_amount: 5, price_delta: 200},
    ])

    console.log('[seed-full] reviews (разные рейтинги, часть без ответа)...')
    const now = new Date()
    const reviewRows: Array<{
        pid: number;
        uid: number;
        sid: number;
        rating: number;
        comment: string;
        reply?: string
    }> = [
        {pid: seller1ProductIds[31], uid: customer1Id, sid: seller1Id, rating: 5, comment: 'Лучшая пахлава в Москве!'},
        {
            pid: seller1ProductIds[32],
            uid: customer2Id,
            sid: seller1Id,
            rating: 5,
            comment: 'Веганский брауни на удивление сочный.'
        },
        {
            pid: seller1ProductIds[35],
            uid: customer1Id,
            sid: seller1Id,
            rating: 4,
            comment: 'Очень вкусно, но многовато сахара.'
        },
        // seller_7: широкий спектр
        {
            pid: seller7ProductIds[0],
            uid: customer1Id,
            sid: seller7Id,
            rating: 5,
            comment: 'Шеф превзошёл ожидания, торт на свадьбу был шикарен.',
            reply: 'Спасибо большое за тёплый отзыв!'
        },
        {
            pid: seller7ProductIds[1],
            uid: customer3Id,
            sid: seller7Id,
            rating: 5,
            comment: 'Мадлен — нежные, ароматные. Беру второй раз.',
            reply: 'Будем рады новой встрече!'
        },
        {
            pid: seller7ProductIds[2],
            uid: customer2Id,
            sid: seller7Id,
            rating: 4,
            comment: 'Фисташка чувствуется, крем мог бы быть гуще.'
        },
        {
            pid: seller7ProductIds[5],
            uid: customer3Id,
            sid: seller7Id,
            rating: 3,
            comment: 'Нормально, но я ожидал более выраженный шоколадный вкус.'
        },
        {
            pid: seller7ProductIds[4],
            uid: customer2Id,
            sid: seller7Id,
            rating: 2,
            comment: 'Один из капкейков был помят. Жаль.'
        },
        {
            pid: seller7ProductIds[3],
            uid: customer1Id,
            sid: seller7Id,
            rating: 1,
            comment: 'Доставили с опозданием на 2 часа — испортили вечер.'
        },
    ]
    for (const r of reviewRows) {
        await db.insert(reviews).values({
            product_id: r.pid,
            user_id: r.uid,
            seller_id: r.sid,
            rating: r.rating,
            comment: r.comment,
            seller_reply: r.reply ?? null,
            reply_date: r.reply ? now : null,
            created_at: now,
            updated_at: now,
        })
    }

    console.log('[seed-full] customer orders + seller orders для кондитера_7...')

    // Сценарий A: оплаченный заказ на стандартный товар (готовится)
    {
        const [co] = await db.insert(customerOrders).values({
            user_id: customer1Id,
            derived_status: 'in_fulfillment',
            address: 'Москва, ул. Покупателя, 5',
            payment_method: 'card',
            total_estimated: 1800,
        }).returning({customer_order_id: customerOrders.customer_order_id})
        const [so] = await db.insert(sellerOrders).values({
            customer_order_id: co.customer_order_id,
            seller_id: seller7Id,
            status: 'preparing',
            subtotal: 1800,
            customization_delta: 0,
            shipping: 0,
            commission_rate_snapshot: 0.1,
            commission_amount: 180,
            total: 1800,
            stock_check: 'ok',
            paid_at: now,
        }).returning({seller_order_id: sellerOrders.seller_order_id})
        await db.insert(sellerOrderItems).values({
            seller_order_id: so.seller_order_id,
            product_id: seller7ProductIds[4], // капкейки ассорти
            quantity: 1,
            unit_price: 1800,
            customization_delta: 0,
        })
    }

    // Сценарий B: ожидает подтверждения кондитером (новый заказ)
    {
        const [co] = await db.insert(customerOrders).values({
            user_id: customer2Id,
            derived_status: 'negotiating',
            address: 'Москва, Тверская 12',
            payment_method: 'card',
            total_estimated: 840,
        }).returning({customer_order_id: customerOrders.customer_order_id})
        const [so] = await db.insert(sellerOrders).values({
            customer_order_id: co.customer_order_id,
            seller_id: seller7Id,
            status: 'pending_seller_review',
            subtotal: 840,
            total: 840,
            commission_amount: 84,
            stock_check: 'ok',
        }).returning({seller_order_id: sellerOrders.seller_order_id})
        await db.insert(sellerOrderItems).values({
            seller_order_id: so.seller_order_id,
            product_id: seller7ProductIds[1], // мадлен
            quantity: 2,
            unit_price: 420,
        })
    }

    // Сценарий C: с тредом кастомизации (свадебный торт)
    let customizationThreadId = 0
    {
        const [thread] = await db.insert(customizationThreads).values({
            status: 'awaiting_seller_finalize',
        }).returning({customization_thread_id: customizationThreads.customization_thread_id})
        customizationThreadId = thread.customization_thread_id

        const [offerV1] = await db.insert(customizationOffers).values({
            thread_id: customizationThreadId,
            version: 1,
            price_delta: 3500,
            spec_snapshot: {tiers: 3, style: 'rustic', flowers: 'living', notes: 'нужны живые цветы'},
        }).returning({customization_offer_id: customizationOffers.customization_offer_id})
        const [offerV2] = await db.insert(customizationOffers).values({
            thread_id: customizationThreadId,
            version: 2,
            price_delta: 4200,
            spec_snapshot: {tiers: 3, style: 'rustic', flowers: 'living', topper: 'gold', notes: 'добавим золото'},
            superseded_by_offer_id: null,
        }).returning({customization_offer_id: customizationOffers.customization_offer_id})

        // помечаем что v1 заменён v2
        // (для простоты: для теста достаточно факта существования двух офферов)

        await db.insert(customizationMessages).values([
            {
                thread_id: customizationThreadId,
                author: 'customer',
                body: 'Хочу торт на свадьбу 14 июня, 3 яруса, живые цветы.',
                created_at: new Date(now.getTime() - 3 * 86400_000)
            },
            {
                thread_id: customizationThreadId,
                author: 'seller',
                body: 'Здравствуйте! Готов предложить рустик-стиль. Прикладываю смету.',
                created_at: new Date(now.getTime() - 3 * 86400_000 + 3_600_000)
            },
            {
                thread_id: customizationThreadId,
                author: 'customer',
                body: 'Можно ли добавить съедобное золото сверху?',
                created_at: new Date(now.getTime() - 2 * 86400_000)
            },
            {
                thread_id: customizationThreadId,
                author: 'seller',
                body: 'Конечно, обновил оффер — +700 ₽.',
                created_at: new Date(now.getTime() - 2 * 86400_000 + 1_800_000)
            },
            {
                thread_id: customizationThreadId,
                author: 'customer',
                body: 'Отлично, согласовываем!',
                created_at: new Date(now.getTime() - 86400_000)
            },
        ])

        const [co] = await db.insert(customerOrders).values({
            user_id: customer3Id,
            derived_status: 'negotiating',
            address: 'Москва, Кутузовский 21',
            payment_method: 'card',
            total_estimated: 15000 + 4200,
        }).returning({customer_order_id: customerOrders.customer_order_id})
        const [so] = await db.insert(sellerOrders).values({
            customer_order_id: co.customer_order_id,
            seller_id: seller7Id,
            status: 'negotiating',
            subtotal: 15000,
            customization_delta: 4200,
            total: 19200,
            commission_amount: 1920,
            stock_check: 'low',
        }).returning({seller_order_id: sellerOrders.seller_order_id})
        await db.insert(sellerOrderItems).values({
            seller_order_id: so.seller_order_id,
            product_id: seller7ProductIds[3], // свадебный торт
            quantity: 1,
            unit_price: 15000,
            customization_delta: 4200,
            customization_thread_id: customizationThreadId,
        })
    }

    // Сценарий D: доставлен — для истории и отзывов
    {
        const [co] = await db.insert(customerOrders).values({
            user_id: customer1Id,
            derived_status: 'delivered',
            address: 'Москва, Ленинский 3',
            payment_method: 'card',
            total_estimated: 4200,
        }).returning({customer_order_id: customerOrders.customer_order_id})
        const [so] = await db.insert(sellerOrders).values({
            customer_order_id: co.customer_order_id,
            seller_id: seller7Id,
            status: 'delivered',
            subtotal: 4200,
            total: 4200,
            commission_amount: 420,
            stock_check: 'ok',
            paid_at: new Date(now.getTime() - 7 * 86400_000),
        }).returning({seller_order_id: sellerOrders.seller_order_id})
        await db.insert(sellerOrderItems).values({
            seller_order_id: so.seller_order_id,
            product_id: seller7ProductIds[0], // Наполеон
            quantity: 1,
            unit_price: 4200,
        })
    }

    // Сценарий E: отменён с возвратом
    {
        const [co] = await db.insert(customerOrders).values({
            user_id: customer2Id,
            derived_status: 'cancelled',
            address: 'Москва, Арбат 4',
            payment_method: 'card',
            total_estimated: 690,
        }).returning({customer_order_id: customerOrders.customer_order_id})
        const [so] = await db.insert(sellerOrders).values({
            customer_order_id: co.customer_order_id,
            seller_id: seller7Id,
            status: 'cancelled',
            subtotal: 690,
            total: 690,
            commission_amount: 69,
            stock_check: 'ok',
            refund_state: 'approved',
            refund_reason: 'Покупатель отменил заказ до начала приготовления',
            cancel_reason: 'Customer requested cancellation',
        }).returning({seller_order_id: sellerOrders.seller_order_id})
        await db.insert(sellerOrderItems).values({
            seller_order_id: so.seller_order_id,
            product_id: seller7ProductIds[5], // брауни без сахара
            quantity: 1,
            unit_price: 690,
        })
    }

    console.log('[seed-full] notifications для пользователя кондитера_7...')
    await db.insert(notifications).values([
        {
            recipient_user_id: seller7UserId,
            kind: 'chat_message',
            severity: 'info',
            title_md: 'Новое сообщение в чате',
            body_md: 'Покупатель: «Можно ли добавить съедобное золото сверху?»',
            meta: {thread_id: customizationThreadId},
        },
        {
            recipient_user_id: seller7UserId,
            kind: 'chat_offer',
            severity: 'info',
            title_md: 'Покупатель принял оффер v2',
            body_md: 'Заказ ожидает финального подтверждения.',
            meta: {thread_id: customizationThreadId},
        },
        {
            recipient_user_id: seller7UserId,
            kind: 'customer_accept',
            severity: 'success',
            title_md: 'Новый заказ от покупателя',
            body_md: 'Капкейки ассорти 6 шт — 1 шт.',
        },
        {
            recipient_user_id: seller7UserId,
            kind: 'seller_order_paid_reminder',
            severity: 'warning',
            title_md: 'Напоминание: заказ оплачен',
            body_md: 'Начните приготовление — срок доставки приближается.',
        },
        {
            recipient_user_id: seller7UserId,
            kind: 'ingredient_low',
            severity: 'warning',
            title_md: 'Низкий остаток ингредиента',
            body_md: 'Сливочное масло — ниже порога оповещения.',
        },
        {
            recipient_user_id: seller7UserId,
            kind: 'ingredient_out',
            severity: 'error',
            title_md: 'Ингредиент закончился',
            body_md: 'Фисташковая паста — 0 г.',
        },
        {
            recipient_user_id: seller7UserId,
            kind: 'refund_requested',
            severity: 'warning',
            title_md: 'Запрос на возврат',
            body_md: 'Покупатель просит возврат за заказ #5.',
        },
        {
            recipient_user_id: seller7UserId,
            kind: 'refund_approved',
            severity: 'success',
            title_md: 'Возврат одобрен',
            body_md: 'Деньги вернутся покупателю в течение 3 рабочих дней.',
            read_at: now,
        },
    ])

    console.log('[seed-full] legacy orders за 12 месяцев (для дашборд-аналитики и /orders)...')
    // Аналитика в app/api/seller/analytics/route.ts читает legacy `orders` + `order_items`,
    // считает выручку и заказы по месяцам — без исторических заказов графики будут пустыми.
    const legacyStatuses = ['delivered', 'in_progress', 'processing', 'processed', 'delivering', 'payed'] as const
    const customers = [customer1Id, customer2Id, customer3Id]
    // Распределяем заказы по последним 12 месяцам
    for (let monthsAgo = 0; monthsAgo < 12; monthsAgo++) {
        const ordersInMonth = monthsAgo === 0 ? 4 : monthsAgo <= 2 ? 3 : 2
        for (let i = 0; i < ordersInMonth; i++) {
            const orderDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 5 + i * 6, 12, 0, 0)
            const cust = customers[(monthsAgo + i) % customers.length]
            const status = legacyStatuses[(monthsAgo + i) % legacyStatuses.length]
            // ассортимент для seller_7 + иногда для seller_1
            const useSeller7 = i % 2 === 0 || monthsAgo === 0
            const productPool = useSeller7 ? seller7ProductIds : Object.values(seller1ProductIds)
            const productId = productPool[(monthsAgo + i) % productPool.length]
            const quantity = 1 + (i % 3)
            const [ord] = await db.insert(orders).values({
                date: orderDate,
                order_status: status,
                user_id: cust,
                total_price: 0,
                address: 'Москва, ул. Покупателя, 5',
                payment_method: i % 3 === 0 ? 'cash' : 'card',
            }).returning({order_id: orders.order_id})
            await db.insert(orderItems).values({
                order_id: ord.order_id,
                product_id: productId,
                quantity,
            })
        }
    }
    // Гарантируем что у customer1 есть заказы во всех статусах (для /orders)
    for (const status of legacyStatuses) {
        const [ord] = await db.insert(orders).values({
            date: now,
            order_status: status,
            user_id: customer1Id,
            total_price: 0,
            address: 'Москва, ул. Покупателя, 5',
            payment_method: 'card',
        }).returning({order_id: orders.order_id})
        await db.insert(orderItems).values({
            order_id: ord.order_id,
            product_id: seller7ProductIds[1],
            quantity: 1,
        })
    }

    console.log('[seed-full] done ✅')
    console.log(`  seller_1 → id=${seller1Id}, продуктов: ${Object.keys(seller1ProductIds).length}`)
    console.log(`  seller_7 → id=${seller7Id}, продуктов: ${seller7ProductIds.length}`)
    console.log(`  логин кондитера_7: seller7@test.local / password123`)
    console.log(`  покупатели: customer1@test.local, customer2@test.local, customer3@test.local (password123)`)
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error('[seed-full] failed', e)
        process.exit(1)
    })
