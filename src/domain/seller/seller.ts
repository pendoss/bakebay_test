import type {SellerId, UserId} from '@/src/domain/shared/id'

export interface Seller {
    id: SellerId
    userId: UserId | null
    name: string
    rating: number
    description: string
    location: string
    website: string | null
    contactName: string
    contactEmail: string
    contactNumber: string
    inn: string | null
    aboutProducts: string | null
    imageUrl: string | null
}

export class SellerNotFoundError extends Error {
    constructor(target: string) {
        super(`Seller ${target} not found`)
        this.name = 'SellerNotFoundError'
    }
}
