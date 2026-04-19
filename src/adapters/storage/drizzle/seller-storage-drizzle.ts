import {eq} from 'drizzle-orm'
import {db, sellers} from '@/src/adapters/storage/drizzle'
import type {SellerStorage} from '@/src/application/ports/seller-storage'
import type {Seller} from '@/src/domain/seller'
import type {SellerId, UserId} from '@/src/domain/shared/id'
import {asSellerId, asUserId} from '@/src/domain/shared/id'

interface SellerRow {
    seller_id: number
    user_id: number | null
    seller_name: string
    seller_rating: number | null
    description: string
    location: string
    website: string | null
    contact_name: string
    contact_email: string
    contact_number: string
    inn: string | null
    about_products: string | null
    image_url: string | null
}

function rowToSeller(row: SellerRow): Seller {
    return {
        id: asSellerId(row.seller_id),
        userId: row.user_id !== null ? asUserId(row.user_id) : null,
        name: row.seller_name,
        rating: row.seller_rating ?? 0,
        description: row.description,
        location: row.location,
        website: row.website,
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        contactNumber: row.contact_number,
        inn: row.inn,
        aboutProducts: row.about_products,
        imageUrl: row.image_url,
    }
}

export function sellerStorageDrizzle(): SellerStorage {
    return {
        async findById(id: SellerId): Promise<Seller | null> {
            const rows = await db.select().from(sellers).where(eq(sellers.seller_id, id as unknown as number)).limit(1)
            return rows[0] ? rowToSeller(rows[0] as unknown as SellerRow) : null
        },

        async findByUserId(userId: UserId): Promise<Seller | null> {
            const rows = await db.select().from(sellers).where(eq(sellers.user_id, userId as unknown as number)).limit(1)
            return rows[0] ? rowToSeller(rows[0] as unknown as SellerRow) : null
        },

        async list(): Promise<Seller[]> {
            const rows = await db.select().from(sellers)
            return rows.map((r) => rowToSeller(r as unknown as SellerRow))
        },
    }
}
