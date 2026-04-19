import {
    isOwnedBySeller,
    getMainImage,
    validateDraft,
    ProductValidationError,
    applyFilters,
    computePriceRange,
    matchesFilters,
} from '../index'
import type {Product, ProductImage, ProductDraft} from '../index'
import {asProductId, asSellerId} from '@/src/domain/shared/id'

const sampleProduct = (over: Partial<Product> = {}): Product => ({
    id: asProductId(1),
    sellerId: asSellerId(10),
    name: 'Cake',
    price: 100,
    cost: 50,
    shortDesc: 's',
    longDesc: 'l',
    category: 'Торты',
    storageConditions: '',
    stock: 5,
    sku: null,
    weight: null,
    size: null,
    shelfLife: null,
    trackInventory: true,
    lowStockAlert: false,
    status: 'active',
    categoryId: null,
    dietary: [],
    images: [],
    mainImage: null,
    seller: null,
    categoryInfo: null,
    rating: 4.5,
    ...over,
})

describe('product domain', () => {
    it('isOwnedBySeller: true when ids match', () => {
        expect(isOwnedBySeller(sampleProduct(), asSellerId(10))).toBe(true)
        expect(isOwnedBySeller(sampleProduct(), asSellerId(11))).toBe(false)
        expect(isOwnedBySeller(sampleProduct(), null)).toBe(false)
    })

    it('getMainImage prefers isMain, falls back to first', () => {
        const images: ProductImage[] = [
            {url: 'a', name: '', isMain: false, displayOrder: 0, s3Key: null},
            {url: 'b', name: '', isMain: true, displayOrder: 1, s3Key: null},
        ]
        expect(getMainImage(images)).toBe('b')
        expect(getMainImage([{...images[0]}])).toBe('a')
        expect(getMainImage([])).toBeNull()
    })

    it('validateDraft throws on missing fields', () => {
        const draft: ProductDraft = {
            name: '',
            price: 0,
            shortDesc: '',
            longDesc: '',
            category: '',
            storageConditions: '',
            sellerId: asSellerId(1),
        }
        expect(() => validateDraft(draft)).toThrow(ProductValidationError)
    })

    it('matchesFilters applies price/rating/dietary', () => {
        const p = sampleProduct({price: 100, rating: 4, dietary: ['Vegan']})
        expect(matchesFilters(p, {priceRange: [50, 200]})).toBe(true)
        expect(matchesFilters(p, {priceRange: [101, 200]})).toBe(false)
        expect(matchesFilters(p, {rating: 5})).toBe(false)
        expect(matchesFilters(p, {dietary: ['Vegan']})).toBe(true)
        expect(matchesFilters(p, {dietary: ['Gluten-Free']})).toBe(false)
    })

    it('applyFilters filters array', () => {
        const list = [sampleProduct({price: 50}), sampleProduct({price: 200})]
        expect(applyFilters(list, {priceRange: [0, 100]})).toHaveLength(1)
    })

    it('computePriceRange returns min/max', () => {
        const list = [sampleProduct({price: 100}), sampleProduct({price: 250}), sampleProduct({price: 75.4})]
        expect(computePriceRange(list)).toEqual([75, 250])
        expect(computePriceRange([])).toEqual([0, 0])
    })
})
