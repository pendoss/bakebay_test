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
    user: UserInfo | null
    sellerId: number | null
    isLoading: boolean
    isAuthenticated: boolean
    login: () => Promise<void>
    logout: () => Promise<void>
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

async function fetchUserInfo(): Promise<UserInfo | null> {
    try {
        const resp = await fetch("/api/users/me", {credentials: 'include'})
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
    const [user, setUser] = useState<UserInfo | null>(null)
    const [sellerId, setSellerId] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const loadUser = async () => {
        const info = await fetchUserInfo()
        if (!info) {
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
        loadUser().finally(() => setIsLoading(false))
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const login = async () => {
        await loadUser()
    }

    const logout = async () => {
        await fetch('/api/auth/logout', {method: 'POST', credentials: 'include'})
        setUser(null)
        setSellerId(null)
    }

    const refreshUser = async () => {
        await loadUser()
    }

    return (
        <UserContext.Provider value={{user, sellerId, isLoading, isAuthenticated: user !== null, login, logout, refreshUser}}>
            {children}
        </UserContext.Provider>
    )
}
