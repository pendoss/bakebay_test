"use client"

import {createContext, useContext, useState, useEffect, type ReactNode} from "react"

export interface UserInfo {
    user_id: number
    first_name: string
    last_name: string
    email: string
    user_role: string
    phone_number?: string
    address?: string
    city?: string
    postal_code?: string
    country?: string
    created_at?: string
}

interface UserContextType {
    token: string | null
    user: UserInfo | null
    sellerId: number | null
    isLoading: boolean
    login: (token: string) => Promise<void>
    logout: () => void
    refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function useUser() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error("useUser должен использоваться внутри UserProvider")
    }
    return context
}

async function fetchUserInfo(token: string): Promise<UserInfo | null> {
    try {
        const resp = await fetch("/api/users/me", {
            headers: {Authorization: `Bearer ${token}`},
        })
        if (!resp.ok) return null
        return await resp.json()
    } catch {
        return null
    }
}

async function fetchSellerId(userId: number): Promise<number | null> {
    try {
        const resp = await fetch(`/api/sellers?userId=${userId}`)
        if (!resp.ok) return null
        const list = await resp.json()
        return list[0]?.seller_id ?? null
    } catch {
        return null
    }
}

export function UserProvider({children}: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null)
    const [user, setUser] = useState<UserInfo | null>(null)
    const [sellerId, setSellerId] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const loadUser = async (tok: string) => {
        const info = await fetchUserInfo(tok)
        if (!info) {
            // Token is invalid — clear everything
            localStorage.removeItem("auth")
            setToken(null)
            setUser(null)
            setSellerId(null)
            return
        }
        setUser(info)
        if (info.user_role === "seller") {
            const id = await fetchSellerId(info.user_id)
            setSellerId(id)
        } else {
            setSellerId(null)
        }
    }

    // Load on mount
    useEffect(() => {
        const stored = localStorage.getItem("auth")
        if (stored) {
            setToken(stored)
            loadUser(stored).finally(() => setIsLoading(false))
        } else {
            setIsLoading(false)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const login = async (newToken: string) => {
        localStorage.setItem("auth", newToken)
        setToken(newToken)
        await loadUser(newToken)
    }

    const logout = () => {
        localStorage.removeItem("auth")
        setToken(null)
        setUser(null)
        setSellerId(null)
    }

    const refreshUser = async () => {
        const tok = localStorage.getItem("auth")
        if (tok) await loadUser(tok)
    }

    return (
        <UserContext.Provider value={{token, user, sellerId, isLoading, login, logout, refreshUser}}>
            {children}
        </UserContext.Provider>
    )
}
