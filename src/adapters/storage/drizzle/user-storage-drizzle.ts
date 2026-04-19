import {eq} from 'drizzle-orm'
import {db} from '@/src/adapters/storage/drizzle/client'
import {users} from '@/src/adapters/storage/drizzle/schema/users'
import type {UserCreate, UserCredentialsRecord, UserStorage} from '@/src/application/ports/user-storage'
import type {User, UserProfileUpdate, UserRole} from '@/src/domain/user'
import type {UserId} from '@/src/domain/shared/id'
import {asUserId} from '@/src/domain/shared/id'

interface UserRow {
    user_id: number
    email: string
    first_name: string
    last_name: string
    phone_number: string
    address: string | null
    city: string | null
    postal_code: string | null
    country: string | null
    user_role: UserRole | null
    created_at: Date
    updated_at: Date
}

function rowToUser(row: UserRow): User {
    return {
        id: asUserId(row.user_id),
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phoneNumber: row.phone_number,
        address: row.address,
        city: row.city,
        postalCode: row.postal_code,
        country: row.country,
        role: row.user_role ?? 'customer',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

const USER_COLS = {
    user_id: users.user_id,
    email: users.email,
    first_name: users.first_name,
    last_name: users.last_name,
    phone_number: users.phone_number,
    address: users.address,
    city: users.city,
    postal_code: users.postal_code,
    country: users.country,
    user_role: users.user_role,
    created_at: users.created_at,
    updated_at: users.updated_at,
}

export function userStorageDrizzle(): UserStorage {
    return {
        async findById(id: UserId): Promise<User | null> {
            const rows = await db.select(USER_COLS).from(users).where(eq(users.user_id, id as unknown as number)).limit(1)
            return rows[0] ? rowToUser(rows[0]) : null
        },

        async findByEmail(email: string): Promise<User | null> {
            const rows = await db.select(USER_COLS).from(users).where(eq(users.email, email)).limit(1)
            return rows[0] ? rowToUser(rows[0]) : null
        },

        async findCredentialsByEmail(email: string): Promise<UserCredentialsRecord | null> {
            const rows = await db
                .select({user_id: users.user_id, password: users.password, user_role: users.user_role})
                .from(users)
                .where(eq(users.email, email))
                .limit(1)
            if (!rows[0]) return null
            return {
                id: asUserId(rows[0].user_id),
                passwordHash: rows[0].password,
                role: rows[0].user_role ?? 'customer',
            }
        },

        async create(input: UserCreate): Promise<UserId> {
            const now = new Date()
            const [inserted] = await db
                .insert(users)
                .values({
                    email: input.email,
                    first_name: input.firstName,
                    last_name: input.lastName,
                    phone_number: input.phoneNumber,
                    address: '',
                    city: null,
                    postal_code: null,
                    country: null,
                    user_role: input.role ?? 'customer',
                    created_at: now,
                    updated_at: now,
                    password: input.passwordHash,
                })
                .returning({id: users.user_id})
            return asUserId(inserted.id)
        },

        async updateProfile(id: UserId, patch: UserProfileUpdate): Promise<User | null> {
            const values: Record<string, unknown> = {updated_at: new Date()}
            if (patch.firstName !== undefined) values.first_name = patch.firstName
            if (patch.lastName !== undefined) values.last_name = patch.lastName
            if (patch.email !== undefined) values.email = patch.email
            if (patch.phoneNumber !== undefined) values.phone_number = patch.phoneNumber
            if (patch.address !== undefined) values.address = patch.address
            if (patch.city !== undefined) values.city = patch.city
            if (patch.postalCode !== undefined) values.postal_code = patch.postalCode
            if (patch.country !== undefined) values.country = patch.country
            const rows = await db
                .update(users)
                .set(values)
                .where(eq(users.user_id, id as unknown as number))
                .returning(USER_COLS)
            return rows[0] ? rowToUser(rows[0]) : null
        },

        async updatePassword(id: UserId, passwordHash: string): Promise<void> {
            await db
                .update(users)
                .set({password: passwordHash, updated_at: new Date()})
                .where(eq(users.user_id, id as unknown as number))
        },
    }
}
