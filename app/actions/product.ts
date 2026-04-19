'use server'

import {
    createProduct as createProductUseCase,
    updateProduct as updateProductUseCase,
} from '@/src/application/use-cases/product'
import type {UpdateProductImage as UpdateProductImageDomain} from '@/src/application/use-cases/product'
import {productStorageDrizzle} from '@/src/adapters/storage/drizzle/product-storage-drizzle'
import {fileStorageS3} from '@/src/adapters/storage/s3/file-storage-s3'
import {asProductId, asSellerId} from '@/src/domain/shared/id'
import {
    ProductForbiddenError,
    ProductNotFoundError,
    ProductValidationError,
} from '@/src/domain/product'

interface ProductImageUpload {
    url: string
    file: File
    name: string
}

interface ProductIngredientInput {
    name: string
    amount: string
    unit: string
}

interface CreateProductInput {
    name: string
    description: string
    category: string
    status: string
    price: number
    cost: number
    inventory: number
    sku: string
    weight: number
    size: string
    storageInstructions: string
    shelfLife: number
    trackInventory: boolean
    lowStockAlert: boolean
    dietaryInfo: string[]
    images: ProductImageUpload[]
    ingredients: ProductIngredientInput[]
    sellerId?: number
}

export async function createProduct(formData: Partial<CreateProductInput>) {
    try {
        if (!formData.sellerId) {
            return {success: false as const, error: 'sellerId required'}
        }
        const {productId} = await createProductUseCase(
            {
                draft: {
                    name: formData.name ?? '',
                    price: formData.price ?? 0,
                    cost: formData.cost,
                    shortDesc: formData.description?.substring(0, 100) ?? '',
                    longDesc: formData.description ?? '',
                    category: formData.category ?? '',
                    storageConditions: formData.storageInstructions ?? '',
                    stock: formData.inventory,
                    sku: formData.sku,
                    weight: formData.weight,
                    size: formData.size,
                    shelfLife: formData.shelfLife,
                    trackInventory: formData.trackInventory,
                    lowStockAlert: formData.lowStockAlert,
                    status: (formData.status === 'draft' || formData.status === 'hidden' ? formData.status : 'active'),
                    sellerId: asSellerId(formData.sellerId),
                    dietary: formData.dietaryInfo,
                    ingredients: formData.ingredients?.map((i) => ({
                        name: i.name,
                        amount: parseFloat(i.amount) || 0,
                        unit: i.unit,
                    })),
                },
                imageUploads: (formData.images ?? []).map((img) => ({file: img.file, name: img.name})),
            },
            {productStorage: productStorageDrizzle(), fileStorage: fileStorageS3()},
        )
        return {success: true as const, productId}
    } catch (err) {
        if (err instanceof ProductValidationError) {
            return {success: false as const, error: err.message}
        }
        console.error('Error creating product:', err)
        return {success: false as const, error: 'Failed to create product'}
    }
}

interface UpdateProductImageInput {
    url: string
    file?: File
    name: string
    isExisting?: boolean
    s3_key?: string
}

interface UpdateProductData {
    product_id: number
    product_name: string
    price: number
    cost?: number
    short_desc: string
    long_desc: string
    category: string
    storage_conditions: string
    stock: number
    sku?: string
    weight?: number
    size?: string
    shelf_life?: number
    status?: string
}

export async function updateProduct(
    formData: UpdateProductData,
    images: UpdateProductImageInput[],
    actorSellerId?: number,
) {
    try {
        const mappedImages: UpdateProductImageDomain[] = images.map((img) => ({
            url: img.url,
            file: img.file,
            name: img.name,
            isExisting: img.isExisting,
            s3Key: img.s3_key ?? null,
        }))
        await updateProductUseCase(
            {
                patch: {
                    id: asProductId(formData.product_id),
                    name: formData.product_name,
                    price: formData.price,
                    cost: formData.cost,
                    shortDesc: formData.short_desc,
                    longDesc: formData.long_desc,
                    category: formData.category,
                    storageConditions: formData.storage_conditions,
                    stock: formData.stock,
                    sku: formData.sku,
                    weight: formData.weight,
                    size: formData.size,
                    shelfLife: formData.shelf_life,
                    status: formData.status,
                },
                images: mappedImages,
                actorSellerId: actorSellerId !== undefined ? asSellerId(actorSellerId) : null,
            },
            {productStorage: productStorageDrizzle(), fileStorage: fileStorageS3()},
        )
        return {success: true as const}
    } catch (err) {
        if (err instanceof ProductNotFoundError) return {success: false as const, error: 'Product not found'}
        if (err instanceof ProductForbiddenError) return {success: false as const, error: err.message}
        const message = err instanceof Error ? err.message : String(err)
        console.error('Error updating product:', message)
        return {success: false as const, error: message}
    }
}
