import * as jwt from 'jsonwebtoken'
import type {TokenService} from '@/src/application/ports/token-service'
import type {SessionPayload} from '@/src/domain/auth'
import type {UserRole} from '@/src/domain/user'
import {asUserId} from '@/src/domain/shared/id'

interface RawPayload {
    userId: number
    role: UserRole | string
}

export function tokenServiceJwt(): TokenService {
    const secret = process.env.JWT_SECRET_KEY
    if (!secret) throw new Error('JWT_SECRET_KEY is not defined')
    return {
        issue(payload: SessionPayload): string {
            return jwt.sign({
                userId: payload.userId as unknown as number,
                role: payload.role
            }, secret, {expiresIn: '1h'})
        },
        verify(token: string): SessionPayload {
            const decoded = jwt.verify(token, secret) as RawPayload
            return {userId: asUserId(decoded.userId), role: (decoded.role ?? 'customer') as UserRole}
        },
    }
}
