import type {Product, ProductImage, ProductStatus} from '@/src/domain/product'
import {getMainImage} from '@/src/domain/product'
import {asProductId, asSellerId} from '@/src/domain/shared/id'

interface ProductRow {
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
    category_id: number | null
    sku: string | null
    weight: number | null
    size: string | null
    shelf_life: number | null
    track_inventory: boolean | null
    low_stock_alert: boolean | null
    status: string | null
    is_customizable?: boolean | null
}

interface ImageRow {
    image_url: string
    name: string | null
    is_main: boolean | null
    display_order: number | null
    s3_key: string | null
}

interface SellerRow {
    seller_id: number
    seller_name: string
    seller_rating: number | null
}

interface CategoryRow {
    id: number
    name: string
}

function mapImage(row: ImageRow): ProductImage {
    return {
        url: row.image_url,
        name: row.name ?? '',
        isMain: row.is_main ?? false,
        displayOrder: row.display_order ?? 0,
        s3Key: row.s3_key,
    }
}

function mapStatus(raw: string | null): ProductStatus {
    if (raw === 'draft' || raw === 'hidden') return raw
    return 'active'
}

export interface ProductRowBundle {
    product: ProductRow
    images: ImageRow[]
    dietary: string[]
    seller?: SellerRow | null
    category?: CategoryRow | null
}

export function rowsToProduct(bundle: ProductRowBundle): Product {
    const images = bundle.images
        .slice()
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map(mapImage)

    return {
        id: asProductId(bundle.product.product_id),
        sellerId: bundle.product.seller_id !== null ? asSellerId(bundle.product.seller_id) : null,
        name: bundle.product.product_name,
        price: bundle.product.price,
        cost: bundle.product.cost,
        shortDesc: bundle.product.short_desc,
        longDesc: bundle.product.long_desc,
        category: bundle.product.category,
        storageConditions: bundle.product.storage_conditions,
        stock: bundle.product.stock ?? 0,
        sku: bundle.product.sku,
        weight: bundle.product.weight,
        size: bundle.product.size,
        shelfLife: bundle.product.shelf_life,
        trackInventory: bundle.product.track_inventory ?? true,
        lowStockAlert: bundle.product.low_stock_alert ?? false,
        status: mapStatus(bundle.product.status),
        categoryId: bundle.product.category_id,
        dietary: bundle.dietary,
        images,
        mainImage: getMainImage(images),
        seller: bundle.seller
            ? {
                id: asSellerId(bundle.seller.seller_id),
                name: bundle.seller.seller_name,
                rating: bundle.seller.seller_rating
            }
            : null,
        categoryInfo: bundle.category ? {id: bundle.category.id, name: bundle.category.name} : null,
        rating: bundle.seller?.seller_rating ?? 4.5,
        isCustomizable: bundle.product.is_customizable ?? false,
    }
}
