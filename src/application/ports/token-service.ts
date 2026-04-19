import type {SessionPayload} from '@/src/domain/auth'

export interface TokenService {
    issue(payload: SessionPayload): string

    verify(token: string): SessionPayload
}
