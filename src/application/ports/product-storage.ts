import type {Product, ProductDraft, ProductIngredient, ProductImage, ProductSearchResult} from '@/src/domain/product'
import type {ProductId, SellerId} from '@/src/domain/shared/id'

export interface ProductListFilters {
    categoryId?: number | null
    categoryName?: string | null
    sellerId?: SellerId | null
}

export interface ProductImageInput {
    url: string
    name: string
    isMain: boolean
    displayOrder: number
    s3Key: string | null
}

export interface ProductUpdateInput {
    id: ProductId
    name: string
    price: number
    cost?: number | null
    shortDesc: string
    longDesc: string
    category: string
    storageConditions: string
    stock: number
    sku?: string | null
    weight?: number | null
    size?: string | null
    shelfLife?: number | null
    status?: string
}

export interface ProductStorage {
    findById(id: ProductId): Promise<Product | null>

    list(filters: ProductListFilters): Promise<Product[]>

    search(query: string, limit?: number): Promise<ProductSearchResult>

    listBySeller(sellerId: SellerId): Promise<Product[]>

    countBySeller(sellerId: SellerId): Promise<number>

    create(draft: ProductDraft): Promise<ProductId>

    update(input: ProductUpdateInput): Promise<boolean>

    delete(id: ProductId): Promise<boolean>

    replaceDietary(id: ProductId, dietary: string[]): Promise<void>

    replaceIngredients(id: ProductId, ingredients: ProductIngredient[]): Promise<void>

    replaceImages(id: ProductId, images: ProductImageInput[]): Promise<void>
}

export type ProductImageRef = ProductImage
