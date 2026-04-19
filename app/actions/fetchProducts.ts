'use server'

import {productStorageDrizzle} from '@/src/adapters/storage/drizzle/product-storage-drizzle'
import {listProductsBySeller, listProducts} from '@/src/application/use-cases/product'
import {asSellerId} from '@/src/domain/shared/id'

interface ProductRow {
    id: number
    name: string
    price: number
    inventory: number
    category: string
    image: string
    status: string
    rating: number
    sales: number
}

function statusText(status: string): string {
    switch (status) {
        case 'active':
            return 'Активен'
        case 'draft':
            return 'Черновик'
        case 'hidden':
            return 'Скрыт'
        default:
            return status
    }
}

export async function fetchProducts(sellerId?: number | null): Promise<{
    products: ProductRow[];
    error: string | null
}> {
    try {
        const deps = {productStorage: productStorageDrizzle()}
        const products = sellerId
            ? await listProductsBySeller(asSellerId(sellerId), deps)
            : await listProducts({}, deps)

        const rows = products.map<ProductRow>((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            inventory: p.stock,
            category: p.category,
            image: p.mainImage ?? '/placeholder.svg?height=200&width=200',
            status: statusText(p.status),
            rating: p.rating,
            sales: 0,
        }))
        return {products: rows, error: null}
    } catch (err) {
        console.error('Error fetching products:', err)
        return {products: [], error: 'Failed to load products. Please try again later.'}
    }
}
