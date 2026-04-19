import {validateRegistration} from '@/src/domain/user'
import type {RegisterInput} from '@/src/domain/user'
import type {SessionPayload} from '@/src/domain/auth'
import type {UserStorage} from '@/src/application/ports/user-storage'
import type {PasswordHasher} from '@/src/application/ports/password-hasher'
import type {TokenService} from '@/src/application/ports/token-service'

export interface RegisterUserDeps {
    userStorage: UserStorage
    passwordHasher: PasswordHasher
    tokenService: TokenService
}

export interface RegisterUserResult {
    session: SessionPayload
    token: string
}

export async function registerUser(input: RegisterInput, deps: RegisterUserDeps): Promise<RegisterUserResult> {
    const parsed = validateRegistration(input)
    const passwordHash = await deps.passwordHasher.hash(parsed.password)
    const id = await deps.userStorage.create({
        email: parsed.email,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        phoneNumber: '+79999999999',
        passwordHash,
        role: 'customer',
    })
    const session: SessionPayload = {userId: id, role: 'customer'}
    return {session, token: deps.tokenService.issue(session)}
}
