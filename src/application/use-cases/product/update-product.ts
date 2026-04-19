import type {ProductIngredient} from '@/src/domain/product'
import {ProductForbiddenError, ProductNotFoundError, isOwnedBySeller} from '@/src/domain/product'
import type {ProductId, SellerId} from '@/src/domain/shared/id'
import type {ProductStorage, ProductUpdateInput} from '@/src/application/ports/product-storage'
import type {FileStorage} from '@/src/application/ports/file-storage'

export interface UpdateProductImage {
    url: string
    file?: File
    name: string
    isExisting?: boolean
    s3Key?: string | null
}

export interface UpdateProductInput {
    patch: ProductUpdateInput
    ingredients?: ProductIngredient[]
    dietary?: string[]
    images: UpdateProductImage[]
    actorSellerId?: SellerId | null
}

export interface UpdateProductDeps {
    productStorage: ProductStorage
    fileStorage: FileStorage
}

export async function updateProduct(input: UpdateProductInput, deps: UpdateProductDeps): Promise<void> {
    const existing = await deps.productStorage.findById(input.patch.id)
    if (!existing) throw new ProductNotFoundError(input.patch.id)
    if (input.actorSellerId !== undefined && input.actorSellerId !== null) {
        if (!isOwnedBySeller(existing, input.actorSellerId)) throw new ProductForbiddenError()
    }

    const updated = await deps.productStorage.update(input.patch)
    if (!updated) throw new ProductNotFoundError(input.patch.id)

    const uploaded = await Promise.all(
        input.images.map(async (image, index) => {
            let url = image.url
            let key = image.s3Key ?? `${input.patch.id}_edit_${index}`
            if (image.file) {
                key = `${input.patch.id}_${Date.now()}_${index}`
                url = await deps.fileStorage.upload(key, image.file)
            }
            return {
                url,
                name: image.name,
                isMain: index === 0,
                displayOrder: index,
                s3Key: key,
            }
        }),
    )
    await deps.productStorage.replaceImages(input.patch.id, uploaded)

    if (input.dietary) {
        await deps.productStorage.replaceDietary(input.patch.id, input.dietary)
    }
    if (input.ingredients) {
        await deps.productStorage.replaceIngredients(input.patch.id, input.ingredients)
    }
}

export {ProductId}
