import {tokenServiceJwt} from '@/src/adapters/auth/token-service-jwt'
import type {UserRole} from '@/src/domain/user'
import {asUserId} from '@/src/domain/shared/id'

interface UserPayload {
	userId: number
	role: string
}

export const Encode = (payload: UserPayload): string => {
	return tokenServiceJwt().issue({
		userId: asUserId(payload.userId),
		role: (payload.role ?? 'customer') as UserRole,
	})
}

export const Decode = (token: string): UserPayload => {
	const session = tokenServiceJwt().verify(token)
	return {userId: session.userId as unknown as number, role: session.role}
}
