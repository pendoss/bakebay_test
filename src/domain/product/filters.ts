import type {Product} from './product'
import type {SellerId} from '@/src/domain/shared/id'

export interface ProductFilters {
    priceRange?: [number, number]
    rating?: number
    dietary?: string[]
    categories?: string[]
    sellers?: SellerId[]
}

export function matchesFilters(product: Product, filters: ProductFilters): boolean {
    const {priceRange, rating, dietary} = filters
    if (priceRange && (product.price < priceRange[0] || product.price > priceRange[1])) {
        return false
    }
    if (rating && rating > 0 && (!product.rating || product.rating < rating)) {
        return false
    }
    if (dietary && dietary.length > 0) {
        if (product.dietary.length === 0) return false
        if (!dietary.some((d) => product.dietary.includes(d))) return false
    }
    return true
}

export function applyFilters(products: Product[], filters: ProductFilters): Product[] {
    return products.filter((p) => matchesFilters(p, filters))
}

export function computePriceRange(products: Product[]): [number, number] {
    if (products.length === 0) return [0, 0]
    const prices = products.map((p) => p.price).filter((p) => !isNaN(p))
    if (prices.length === 0) return [0, 0]
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]
}
