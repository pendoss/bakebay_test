import * as jwt from "jsonwebtoken"

interface UserPayload{
    userId :number 
    role: string
}

const secret = process.env.JWT_SECRET_KEY!

export const Encode = (payload: UserPayload): string => {
    return jwt.sign(payload, secret, { expiresIn: '1h' })
}

export const Decode = (token : string) : UserPayload =>{
    const decoded = jwt.verify(token, secret)
    return decoded as UserPayload
}

