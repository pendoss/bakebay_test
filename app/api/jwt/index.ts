import * as jwt from "jsonwebtoken"

interface UserPayload {
    userId: number 
    role: string
}

const secret = process.env.JWT_SECRET_KEY || ""


export const Encode = (payload: UserPayload): string => {

    try {
        const encoded = jwt.sign(payload, secret, { expiresIn: '1h' })
        return encoded
    } catch (error) {
        console.log("Error encoding:", error)
        throw error;
    }
}

export const Decode = (token: string): UserPayload => {
    try {
        console.log("tuta")
        const secret = process.env.JWT_SECRET_KEY;
        if (!secret) {
            throw new Error("JWT_SECRET_KEY is not defined");
        }
        const decoded = jwt.verify(token, secret);
        return decoded as UserPayload;
    } catch (error) {
        console.error("decode error:", error);
        throw error;
    }
}

