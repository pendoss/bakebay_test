import type {ProductDraft} from '@/src/domain/product'
import {validateDraft} from '@/src/domain/product'
import type {ProductId} from '@/src/domain/shared/id'
import type {ProductStorage} from '@/src/application/ports/product-storage'
import type {FileStorage} from '@/src/application/ports/file-storage'

export interface CreateProductImageUpload {
    file: File
    name: string
}

export interface CreateProductInput {
    draft: ProductDraft
    imageUploads: CreateProductImageUpload[]
}

export interface CreateProductDeps {
    productStorage: ProductStorage
    fileStorage: FileStorage
}

export interface CreateProductResult {
    productId: ProductId
}

export async function createProduct(input: CreateProductInput, deps: CreateProductDeps): Promise<CreateProductResult> {
    validateDraft(input.draft)
    const productId = await deps.productStorage.create(input.draft)

    if (input.draft.dietary && input.draft.dietary.length > 0) {
        await deps.productStorage.replaceDietary(productId, input.draft.dietary)
    }
    if (input.draft.ingredients && input.draft.ingredients.length > 0) {
        await deps.productStorage.replaceIngredients(productId, input.draft.ingredients)
    }
    if (input.imageUploads.length > 0) {
        const uploaded = await Promise.all(
            input.imageUploads.map(async (img, index) => {
                const key = `${productId}_${index}`
                const url = await deps.fileStorage.upload(key, img.file)
                return {
                    url,
                    name: img.name || `Изображение ${index + 1}`,
                    isMain: index === 0,
                    displayOrder: index,
                    s3Key: key,
                }
            }),
        )
        await deps.productStorage.replaceImages(productId, uploaded)
    }

    return {productId}
}
