import type {UserId} from '@/src/domain/shared/id'

export interface SessionGateway {
    getUserId(): Promise<UserId | null>

    requireUserId(): Promise<UserId>

    clear(): Promise<void>
}
