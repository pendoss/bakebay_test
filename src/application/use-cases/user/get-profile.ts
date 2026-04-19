import {UserNotFoundError} from '@/src/domain/user'
import type {User} from '@/src/domain/user'
import type {UserId} from '@/src/domain/shared/id'
import type {UserStorage} from '@/src/application/ports/user-storage'

export interface GetProfileDeps {
    userStorage: UserStorage
}

export async function getProfile(id: UserId, deps: GetProfileDeps): Promise<User> {
    const user = await deps.userStorage.findById(id)
    if (!user) throw new UserNotFoundError(id)
    return user
}
