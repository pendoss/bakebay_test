import type {User, UserProfileUpdate, UserRole} from '@/src/domain/user'
import type {UserId} from '@/src/domain/shared/id'

export interface UserCreate {
    email: string
    firstName: string
    lastName: string
    phoneNumber: string
    passwordHash: string
    role?: UserRole
}

export interface UserCredentialsRecord {
    id: UserId
    passwordHash: string
    role: UserRole
}

export interface UserStorage {
    findById(id: UserId): Promise<User | null>

    findByEmail(email: string): Promise<User | null>

    findCredentialsByEmail(email: string): Promise<UserCredentialsRecord | null>

    create(input: UserCreate): Promise<UserId>

    updateProfile(id: UserId, patch: UserProfileUpdate): Promise<User | null>

    updatePassword(id: UserId, passwordHash: string): Promise<void>
}
