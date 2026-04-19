import type {ProductId, SellerId} from '@/src/domain/shared/id'

export type ProductStatus = 'active' | 'draft' | 'hidden'

export interface ProductImage {
    url: string
    name: string
    isMain: boolean
    displayOrder: number
    s3Key: string | null
}

export interface ProductIngredient {
    name: string
    amount: number
    unit: string
}

export interface ProductSeller {
    id: SellerId
    name: string
    rating: number | null
}

export interface ProductCategoryRef {
    id: number
    name: string
}

export interface Product {
    id: ProductId
    sellerId: SellerId | null
    name: string
    price: number
    cost: number | null
    shortDesc: string
    longDesc: string
    category: string
    storageConditions: string
    stock: number
    sku: string | null
    weight: number | null
    size: string | null
    shelfLife: number | null
    trackInventory: boolean
    lowStockAlert: boolean
    status: ProductStatus
    categoryId: number | null
    dietary: string[]
    images: ProductImage[]
    mainImage: string | null
    seller: ProductSeller | null
    categoryInfo: ProductCategoryRef | null
    rating: number
}

export function isOwnedBySeller(product: Pick<Product, 'sellerId'>, sellerId: SellerId | null): boolean {
    if (sellerId === null) return false
    return product.sellerId === sellerId
}

export function getMainImage(images: ProductImage[]): string | null {
    const main = images.find((i) => i.isMain)
    if (main) return main.url
    return images.length > 0 ? images[0].url : null
}

export class ProductNotFoundError extends Error {
    constructor(id: ProductId) {
        super(`Product ${id} not found`)
        this.name = 'ProductNotFoundError'
    }
}

export class ProductForbiddenError extends Error {
    constructor() {
        super('You cannot modify this product')
        this.name = 'ProductForbiddenError'
    }
}

export class ProductValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ProductValidationError'
    }
}

export interface ProductDraft {
    name: string
    price: number
    shortDesc: string
    longDesc: string
    category: string
    storageConditions: string
    sellerId: SellerId
    cost?: number
    stock?: number
    sku?: string
    weight?: number
    size?: string
    shelfLife?: number
    trackInventory?: boolean
    lowStockAlert?: boolean
    status?: ProductStatus
    categoryId?: number
    dietary?: string[]
    ingredients?: ProductIngredient[]
}

export function validateDraft(draft: ProductDraft): void {
    if (!draft.name.trim()) throw new ProductValidationError('name required')
    if (draft.price <= 0) throw new ProductValidationError('price must be positive')
    if (!draft.shortDesc.trim()) throw new ProductValidationError('shortDesc required')
    if (!draft.longDesc.trim()) throw new ProductValidationError('longDesc required')
    if (!draft.category.trim()) throw new ProductValidationError('category required')
    if (!draft.storageConditions.trim()) throw new ProductValidationError('storageConditions required')
}
