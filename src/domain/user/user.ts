import type {UserId} from '@/src/domain/shared/id'

export type UserRole = 'customer' | 'admin' | 'seller'

export interface User {
    id: UserId
    email: string
    firstName: string
    lastName: string
    phoneNumber: string
    address: string | null
    city: string | null
    postalCode: string | null
    country: string | null
    role: UserRole
    createdAt: Date
    updatedAt: Date
}

export interface UserProfileUpdate {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
}

export class UserNotFoundError extends Error {
    constructor(id: UserId | string) {
        super(`User ${id} not found`)
        this.name = 'UserNotFoundError'
    }
}

export class UserValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UserValidationError'
    }
}

export interface RegisterInput {
    name: string
    email: string
    password: string
}

export interface ParsedRegistration {
    firstName: string
    lastName: string
    email: string
    password: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegistration(input: RegisterInput): ParsedRegistration {
    if (!input.email || !EMAIL_RE.test(input.email)) {
        throw new UserValidationError('email is invalid')
    }
    if (!input.password || input.password.length < 6) {
        throw new UserValidationError('password must be at least 6 characters')
    }
    const parts = (input.name ?? '').trim().split(/\s+/)
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new UserValidationError('name and last name are required')
    }
    return {firstName: parts[0], lastName: parts[1], email: input.email, password: input.password}
}

export function fullName(user: Pick<User, 'firstName' | 'lastName'>): string {
    return `${user.firstName} ${user.lastName}`.trim()
}
