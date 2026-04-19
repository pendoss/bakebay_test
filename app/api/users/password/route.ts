import {NextResponse} from 'next/server'
import {getAuthPayload} from '../../get-auth'
import {changePassword} from '@/src/application/use-cases/auth'
import {InvalidCredentialsError} from '@/src/domain/auth'
import {UserNotFoundError} from '@/src/domain/user'
import {userStorageDrizzle} from '@/src/adapters/storage/drizzle/user-storage-drizzle'
import {passwordHasherBcrypt} from '@/src/adapters/auth/password-hasher-bcrypt'
import {asUserId} from '@/src/domain/shared/id'

export async function PUT(request: Request) {
    const payload = await getAuthPayload()
    if (!payload) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    try {
        const body = await request.json() as { currentPassword: string; newPassword: string }
        await changePassword(
            {userId: asUserId(payload.userId), currentPassword: body.currentPassword, nextPassword: body.newPassword},
            {userStorage: userStorageDrizzle(), passwordHasher: passwordHasherBcrypt()},
        )
        return NextResponse.json({success: true})
    } catch (error) {
        if (error instanceof InvalidCredentialsError) {
            return NextResponse.json({error: 'Неверный текущий пароль'}, {status: 400})
        }
        if (error instanceof UserNotFoundError) {
            return NextResponse.json({error: 'User not found'}, {status: 404})
        }
        console.error('Error updating password:', error)
        return NextResponse.json({error: 'Failed to update password'}, {status: 500})
    }
}
