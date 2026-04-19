import {InvalidSessionError} from '@/src/domain/auth'
import type {SessionPayload} from '@/src/domain/auth'
import type {TokenService} from '@/src/application/ports/token-service'

export interface VerifySessionDeps {
    tokenService: TokenService
}

export function verifySession(token: string | null | undefined, deps: VerifySessionDeps): SessionPayload {
    if (!token) throw new InvalidSessionError()
    try {
        return deps.tokenService.verify(token)
    } catch {
        throw new InvalidSessionError()
    }
}
