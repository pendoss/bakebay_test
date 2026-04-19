import {NextResponse} from 'next/server'
import {productStorageDrizzle} from '@/src/adapters/storage/drizzle/product-storage-drizzle'
import {
    getProduct,
    listProducts,
    countProductsBySeller,
    createProduct,
    updateProduct,
    deleteProduct,
} from '@/src/application/use-cases/product'
import {fileStorageS3} from '@/src/adapters/storage/s3/file-storage-s3'
import {
    ProductForbiddenError,
    ProductNotFoundError,
    ProductValidationError,
} from '@/src/domain/product'
import {asProductId, asSellerId} from '@/src/domain/shared/id'
import type {Product} from '@/src/domain/product'

function productStorage() {
    return productStorageDrizzle()
}

function toListResponse(product: Product) {
    return {
        id: product.id,
        name: product.name,
        price: product.price,
        short_desc: product.shortDesc,
        long_desc: product.longDesc,
        category: product.category,
        storage_conditions: product.storageConditions,
        shelf_life: product.shelfLife,
        size: product.size,
        stock: product.stock,
        seller: product.seller
            ? {id: product.seller.id, name: product.seller.name, rating: product.seller.rating}
            : null,
        category_info: product.categoryInfo,
        dietary_constraints: product.dietary.map((name, idx) => ({id: idx, name})),
        images: product.images.map((img) => ({
            image_url: img.url,
            name: img.name,
            is_main: img.isMain,
            display_order: img.displayOrder,
            s3_key: img.s3Key,
        })),
        image: product.mainImage,
    }
}

function toSingleResponse(product: Product) {
    return {
        product_id: product.id,
        seller_id: product.sellerId,
        product_name: product.name,
        price: product.price,
        cost: product.cost,
        short_desc: product.shortDesc,
        long_desc: product.longDesc,
        category: product.category,
        storage_conditions: product.storageConditions,
        stock: product.stock,
        category_id: product.categoryId,
        sku: product.sku,
        weight: product.weight,
        size: product.size,
        shelf_life: product.shelfLife,
        track_inventory: product.trackInventory,
        low_stock_alert: product.lowStockAlert,
        status: product.status,
        dietary_constraints: product.dietary.map((name, idx) => ({id: idx, name})),
        images: product.images.map((img) => ({
            image_url: img.url,
            name: img.name,
            is_main: img.isMain,
            display_order: img.displayOrder,
            s3_key: img.s3Key,
        })),
        image: product.mainImage,
    }
}

export async function GET(request: Request) {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const categoryName = url.searchParams.get('category')
    const sellerParam = url.searchParams.get('seller')
    const countOnly = url.searchParams.get('count')
    const deps = {productStorage: productStorage()}

    try {
        if (countOnly === 'true' && sellerParam) {
            const counter = await countProductsBySeller(asSellerId(parseInt(sellerParam, 10)), deps)
            return NextResponse.json({count: counter})
        }

        if (id) {
            const product = await getProduct(asProductId(parseInt(id, 10)), deps)
            return NextResponse.json(toSingleResponse(product))
        }

        const products = await listProducts(
            {
                categoryName: categoryName ?? undefined,
                sellerId: sellerParam ? asSellerId(parseInt(sellerParam, 10)) : undefined,
            },
            deps,
        )
        return NextResponse.json(products.map(toListResponse))
    } catch (err) {
        if (err instanceof ProductNotFoundError) {
            return NextResponse.json({error: 'Product not found'}, {status: 404})
        }
        console.error('Error fetching products:', err)
        return NextResponse.json({error: 'Failed to fetch products'}, {status: 500})
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as {
            product_name?: string
            price?: number
            short_desc?: string
            long_desc?: string
            category?: string
            storage_conditions?: string
            seller_id?: number
            stock?: number
            category_id?: number
        }
        if (!body.product_name || !body.price || !body.short_desc || !body.long_desc ||
        !body.category || !body.storage_conditions || !body.seller_id) {
            return NextResponse.json({error: 'Missing required fields'}, {status: 400})
        }
        const {productId} = await createProduct(
            {
                draft: {
                    name: body.product_name,
                    price: body.price,
                    shortDesc: body.short_desc,
                    longDesc: body.long_desc,
                    category: body.category,
                    storageConditions: body.storage_conditions,
                    sellerId: asSellerId(body.seller_id),
                    stock: body.stock ?? 0,
                    categoryId: body.category_id,
                },
                imageUploads: [],
            },
            {productStorage: productStorage(), fileStorage: fileStorageS3()},
        )
        return NextResponse.json({product_id: productId})
    } catch (err) {
        if (err instanceof ProductValidationError) {
            return NextResponse.json({error: err.message}, {status: 400})
        }
        console.error('Error creating product:', err)
        return NextResponse.json({error: 'Failed to create product'}, {status: 500})
    }
}

export async function PUT(request: Request) {
    try {
        const body = (await request.json()) as {
            product_id?: number
            product_name?: string
            price?: number
            short_desc?: string
            long_desc?: string
            category?: string
            storage_conditions?: string
            stock?: number
            seller_id?: number
            category_id?: number
        }
        if (!body.product_id) {
            return NextResponse.json({error: 'Missing product ID'}, {status: 400})
        }
        await updateProduct(
            {
                patch: {
                    id: asProductId(body.product_id),
                    name: body.product_name ?? '',
                    price: body.price ?? 0,
                    shortDesc: body.short_desc ?? '',
                    longDesc: body.long_desc ?? '',
                    category: body.category ?? '',
                    storageConditions: body.storage_conditions ?? '',
                    stock: body.stock ?? 0,
                },
                images: [],
            },
            {productStorage: productStorage(), fileStorage: fileStorageS3()},
        )
        return NextResponse.json({success: true})
    } catch (err) {
        if (err instanceof ProductNotFoundError) {
            return NextResponse.json({error: 'Product not found'}, {status: 404})
        }
        if (err instanceof ProductForbiddenError) {
            return NextResponse.json({error: err.message}, {status: 403})
        }
        console.error('Error updating product:', err)
        return NextResponse.json({error: 'Failed to update product'}, {status: 500})
    }
}

export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url)
        const id = url.searchParams.get('id')
        if (!id) return NextResponse.json({error: 'Missing product ID'}, {status: 400})
        await deleteProduct(asProductId(parseInt(id, 10)), {productStorage: productStorage()})
        return NextResponse.json({success: true})
    } catch (err) {
        if (err instanceof ProductNotFoundError) {
            return NextResponse.json({error: 'Product not found'}, {status: 404})
        }
        console.error('Error deleting product:', err)
        return NextResponse.json({error: 'Failed to delete product'}, {status: 500})
    }
}
