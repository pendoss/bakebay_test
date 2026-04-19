import type {UserId} from '@/src/domain/shared/id'
import type {UserRole} from '@/src/domain/user'

export interface Credentials {
    email: string
    password: string
}

export interface SessionPayload {
    userId: UserId
    role: UserRole
}

export class InvalidCredentialsError extends Error {
    constructor() {
        super('Invalid credentials')
        this.name = 'InvalidCredentialsError'
    }
}

export class InvalidSessionError extends Error {
    constructor() {
        super('Invalid session')
        this.name = 'InvalidSessionError'
    }
}

export function isSeller(session: SessionPayload | null): boolean {
    return session?.role === 'seller'
}

export function isAdmin(session: SessionPayload | null): boolean {
    return session?.role === 'admin'
}
