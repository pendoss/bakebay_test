import {UserNotFoundError} from '@/src/domain/user'
import type {User, UserProfileUpdate} from '@/src/domain/user'
import type {UserId} from '@/src/domain/shared/id'
import type {UserStorage} from '@/src/application/ports/user-storage'

export interface UpdateProfileInput {
    id: UserId
    patch: UserProfileUpdate
}

export interface UpdateProfileDeps {
    userStorage: UserStorage
}

export async function updateProfile(input: UpdateProfileInput, deps: UpdateProfileDeps): Promise<User> {
    const updated = await deps.userStorage.updateProfile(input.id, input.patch)
    if (!updated) throw new UserNotFoundError(input.id)
    return updated
}
