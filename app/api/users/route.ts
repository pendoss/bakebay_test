import {NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import {db, users} from '@/src/adapters/storage/drizzle'
import {getAuthPayload} from '../get-auth'
import {registerUser} from '@/src/application/use-cases/auth'
import {updateProfile} from '@/src/application/use-cases/user'
import {UserValidationError} from '@/src/domain/user'
import {userStorageDrizzle} from '@/src/adapters/storage/drizzle/user-storage-drizzle'
import {passwordHasherBcrypt} from '@/src/adapters/auth/password-hasher-bcrypt'
import {tokenServiceJwt} from '@/src/adapters/auth/token-service-jwt'
import {asUserId} from '@/src/domain/shared/id'

export async function GET(_request: Request) {
  try {
    const allUsers = await db.select({
      user_id: users.user_id,
      email: users.email,
      first_name: users.first_name,
      last_name: users.last_name,
      phone_number: users.phone_number,
      address: users.address,
      city: users.city,
      postal_code: users.postal_code,
      country: users.country,
      user_role: users.user_role,
      created_at: users.created_at,
      updated_at: users.updated_at,
    }).from(users)
    return NextResponse.json(allUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({error: 'Failed to fetch users'}, {status: 500})
  }
}

export async function PUT(request: Request) {
  const payload = await getAuthPayload()
  if (!payload) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

  try {
    const body = await request.json() as {
      first_name?: string
      last_name?: string
      email?: string
      phone_number?: string
      address?: string
      city?: string
      postal_code?: string
      country?: string
    }
    const updated = await updateProfile(
        {
          id: asUserId(payload.userId),
          patch: {
            firstName: body.first_name,
            lastName: body.last_name,
            email: body.email,
            phoneNumber: body.phone_number,
            address: body.address,
            city: body.city,
            postalCode: body.postal_code,
            country: body.country,
          },
        },
        {userStorage: userStorageDrizzle()},
    )
    return NextResponse.json({
      user_id: updated.id,
      email: updated.email,
      first_name: updated.firstName,
      last_name: updated.lastName,
      phone_number: updated.phoneNumber,
      address: updated.address,
      city: updated.city,
      postal_code: updated.postalCode,
      country: updated.country,
      user_role: updated.role,
      created_at: updated.createdAt,
    })
  } catch {
    return NextResponse.json({error: 'Failed to update user'}, {status: 500})
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name: string; email: string; password: string }
    const {token} = await registerUser(body, {
      userStorage: userStorageDrizzle(),
      passwordHasher: passwordHasherBcrypt(),
      tokenService: tokenServiceJwt(),
    })
    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    })
    return NextResponse.json({success: true})
  } catch (error) {
    if (error instanceof UserValidationError) {
      return NextResponse.json({error: error.message}, {status: 400})
    }
    console.error('Error creating user:', error)
    return NextResponse.json({error: 'Failed to create user'}, {status: 500})
  }
}
