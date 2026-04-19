import bcrypt from 'bcryptjs'
import type {PasswordHasher} from '@/src/application/ports/password-hasher'

export function passwordHasherBcrypt(): PasswordHasher {
    const saltRounds = Number(process.env.SECRET) || 10
    return {
        async hash(plain: string): Promise<string> {
            return bcrypt.hash(plain, saltRounds)
        },
        async verify(plain: string, hash: string): Promise<boolean> {
            return bcrypt.compare(plain, hash)
        },
    }
}
