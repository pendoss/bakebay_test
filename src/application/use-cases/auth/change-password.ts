import {InvalidCredentialsError} from '@/src/domain/auth'
import {UserNotFoundError} from '@/src/domain/user'
import type {UserId} from '@/src/domain/shared/id'
import type {UserStorage} from '@/src/application/ports/user-storage'
import type {PasswordHasher} from '@/src/application/ports/password-hasher'

export interface ChangePasswordInput {
    userId: UserId
    currentPassword: string
    nextPassword: string
}

export interface ChangePasswordDeps {
    userStorage: UserStorage
    passwordHasher: PasswordHasher
}

export async function changePassword(input: ChangePasswordInput, deps: ChangePasswordDeps): Promise<void> {
    const user = await deps.userStorage.findById(input.userId)
    if (!user) throw new UserNotFoundError(input.userId)
    const record = await deps.userStorage.findCredentialsByEmail(user.email)
    if (!record) throw new UserNotFoundError(input.userId)
    const ok = await deps.passwordHasher.verify(input.currentPassword, record.passwordHash)
    if (!ok) throw new InvalidCredentialsError()
    const hash = await deps.passwordHasher.hash(input.nextPassword)
    await deps.userStorage.updatePassword(input.userId, hash)
}
