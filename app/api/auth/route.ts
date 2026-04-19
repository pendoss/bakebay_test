import {NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import {loginUser} from '@/src/application/use-cases/auth'
import {InvalidCredentialsError} from '@/src/domain/auth'
import {userStorageDrizzle} from '@/src/adapters/storage/drizzle/user-storage-drizzle'
import {passwordHasherBcrypt} from '@/src/adapters/auth/password-hasher-bcrypt'
import {tokenServiceJwt} from '@/src/adapters/auth/token-service-jwt'

export async function POST(req: Request) {
	try {
		const creds = await req.json() as { email: string; password: string }
		const {token} = await loginUser(creds, {
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
		if (error instanceof InvalidCredentialsError) {
			return NextResponse.json({error: 'Invalid credentials.'}, {status: 401})
		}
		console.error('auth login error:', error)
		return NextResponse.json({error: 'Something went wrong.'}, {status: 500})
	}
}
