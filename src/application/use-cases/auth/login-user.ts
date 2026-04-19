import {InvalidCredentialsError} from '@/src/domain/auth'
import type {Credentials, SessionPayload} from '@/src/domain/auth'
import type {UserStorage} from '@/src/application/ports/user-storage'
import type {PasswordHasher} from '@/src/application/ports/password-hasher'
import type {TokenService} from '@/src/application/ports/token-service'

export interface LoginUserDeps {
    userStorage: UserStorage
    passwordHasher: PasswordHasher
    tokenService: TokenService
}

export interface LoginUserResult {
    session: SessionPayload
    token: string
}

export async function loginUser(credentials: Credentials, deps: LoginUserDeps): Promise<LoginUserResult> {
    const record = await deps.userStorage.findCredentialsByEmail(credentials.email)
    if (!record) throw new InvalidCredentialsError()
    const ok = await deps.passwordHasher.verify(credentials.password, record.passwordHash)
    if (!ok) throw new InvalidCredentialsError()
    const session: SessionPayload = {userId: record.id, role: record.role}
    return {session, token: deps.tokenService.issue(session)}
}
