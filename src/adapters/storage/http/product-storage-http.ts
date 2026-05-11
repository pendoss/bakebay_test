import type {Product} from '@/src/domain/product'
import type {ProductId, SellerId} from '@/src/domain/shared/id'
import {asProductId, asSellerId} from '@/src/domain/shared/id'
import type {ProductListFilters} from '@/src/application/ports/product-storage'

interface RawImage {
    image_url: string
    name: string | null
    is_main: boolean | null
    display_order: number | null
    s3_key: string | null
}

interface RawListProduct {
    id: number
    name: string
    price: number
    short_desc: string | null
    long_desc: string | null
    category: string | null
    storage_conditions: string | null
    shelf_life: number | null
    size: string | null
    stock: number | null
    seller: { id: number; name: string; rating: number | null } | null
    category_info: { id: number; name: string } | null
    dietary_constraints: Array<{ id: number; name: string }>
    images: RawImage[]
    image: string | null
    is_customizable?: boolean
}

interface RawSingleProduct {
    product_id: number
    seller_id: number | null
    product_name: string
    price: number
    cost: number | null
    short_desc: string
    long_desc: string
    category: string
    storage_conditions: string
    stock: number | null
    sku: string | null
    weight: number | null
    size: string | null
    shelf_life: number | null
    track_inventory: boolean | null
    low_stock_alert: boolean | null
    status: string | null
    category_id: number | null
    images: RawImage[]
    image: string | null
    dietary_constraints?: Array<{ id: number; name: string }>
    is_customizable?: boolean
}

function mapStatus(raw: string | null): Product['status'] {
    if (raw === 'draft' || raw === 'hidden') return raw
    return 'active'
}

function mapImages(images: RawImage[]): Product['images'] {
    return images
        .slice()
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((img) => ({
            url: img.image_url,
            name: img.name ?? '',
            isMain: img.is_main ?? false,
            displayOrder: img.display_order ?? 0,
            s3Key: img.s3_key,
        }))
}

function fromList(raw: RawListProduct): Product {
    return {
        id: asProductId(raw.id),
        sellerId: raw.seller ? asSellerId(raw.seller.id) : null,
        name: raw.name,
        price: raw.price,
        cost: null,
        shortDesc: raw.short_desc ?? '',
        longDesc: raw.long_desc ?? '',
        category: raw.category ?? '',
        storageConditions: raw.storage_conditions ?? '',
        stock: raw.stock ?? 0,
        sku: null,
        weight: null,
        size: raw.size,
        shelfLife: raw.shelf_life,
        trackInventory: true,
        lowStockAlert: false,
        status: 'active',
        categoryId: raw.category_info?.id ?? null,
        dietary: raw.dietary_constraints.map((d) => d.name),
        images: mapImages(raw.images),
        mainImage: raw.image,
        seller: raw.seller ? {id: asSellerId(raw.seller.id), name: raw.seller.name, rating: raw.seller.rating} : null,
        categoryInfo: raw.category_info,
        rating: raw.seller?.rating ?? 4.5,
        isCustomizable: raw.is_customizable ?? false,
    }
}

function fromSingle(raw: RawSingleProduct): Product {
    const images = mapImages(raw.images ?? [])
    return {
        id: asProductId(raw.product_id),
        sellerId: raw.seller_id !== null ? asSellerId(raw.seller_id) : null,
        name: raw.product_name,
        price: raw.price,
        cost: raw.cost,
        shortDesc: raw.short_desc,
        longDesc: raw.long_desc,
        category: raw.category,
        storageConditions: raw.storage_conditions,
        stock: raw.stock ?? 0,
        sku: raw.sku,
        weight: raw.weight,
        size: raw.size,
        shelfLife: raw.shelf_life,
        trackInventory: raw.track_inventory ?? true,
        lowStockAlert: raw.low_stock_alert ?? false,
        status: mapStatus(raw.status),
        categoryId: raw.category_id,
        dietary: raw.dietary_constraints?.map((d) => d.name) ?? [],
        images,
        mainImage: raw.image ?? images.find((i) => i.isMain)?.url ?? images[0]?.url ?? null,
        seller: null,
        categoryInfo: null,
        rating: 0,
        isCustomizable: raw.is_customizable ?? false,
    }
}

export interface ProductHttpReader {
    findById(id: ProductId): Promise<Product | null>

    list(filters: ProductListFilters): Promise<Product[]>

    countBySeller(sellerId: SellerId): Promise<number>
}

export function productStorageHttp(): ProductHttpReader {
    return {
        async findById(id: ProductId): Promise<Product | null> {
            const res = await fetch(`/api/products?id=${id}`)
            if (res.status === 404) return null
            if (!res.ok) throw new Error(`Failed to fetch product ${id}`)
            const data = (await res.json()) as RawSingleProduct
            return fromSingle(data)
        },

        async list(filters: ProductListFilters): Promise<Product[]> {
            const params = new URLSearchParams()
            if (filters.categoryName) params.append('category', filters.categoryName)
            if (filters.sellerId) params.append('seller', String(filters.sellerId))
            const qs = params.toString()
            const res = await fetch(`/api/products${qs ? `?${qs}` : ''}`)
            if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`)
            const data = (await res.json()) as RawListProduct[] | { products: RawListProduct[] }
            const arr = Array.isArray(data) ? data : data.products
            return arr.map(fromList)
        },

        async countBySeller(sellerId: SellerId): Promise<number> {
            const res = await fetch(`/api/products?count=true&seller=${sellerId}&id=1`)
            if (!res.ok) throw new Error('Failed to count products')
            const data = (await res.json()) as { count: number }
            return data.count
        },
    }
}
