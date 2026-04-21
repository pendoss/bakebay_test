'use client'

import {makeAutoObservable} from 'mobx'
import {useContext} from 'react'
import {RootStoreContext} from './root-store-context'

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

async function fetchUserInfo(): Promise<UserInfo | null> {
    try {
        const resp = await fetch('/api/users/me', {credentials: 'include'})
        if (!resp.ok) return null
        return await resp.json() as UserInfo
    } catch {
        return null
    }
}

async function fetchSellerId(userId: number): Promise<number | null> {
    try {
        const resp = await fetch(`/api/sellers?userId=${userId}`)
        if (!resp.ok) return null
        const list = await resp.json() as Array<{ seller_id: number }>
        return list[0]?.seller_id ?? null
    } catch {
        return null
    }
}

export class UserStore {
    user: UserInfo | null = null
    sellerId: number | null = null
    isLoading = true

    constructor() {
        makeAutoObservable(this)
    }

    get isAuthenticated(): boolean {
        return this.user !== null
    }

    async init(): Promise<void> {
        try {
            await this.loadUser()
        } finally {
            this.isLoading = false
        }
    }

    async login(): Promise<void> {
        await this.loadUser()
    }

    async logout(): Promise<void> {
        await fetch('/api/auth/logout', {method: 'POST', credentials: 'include'})
        this.user = null
        this.sellerId = null
    }

    async refreshUser(): Promise<void> {
        await this.loadUser()
    }

    private async loadUser(): Promise<void> {
        const info = await fetchUserInfo()
        if (!info) {
            this.user = null
            this.sellerId = null
            return
        }
        this.user = info
        if (info.user_role === 'seller') {
            this.sellerId = await fetchSellerId(info.user_id)
        } else {
            this.sellerId = null
        }
    }
}

function useUserStore(): UserStore {
    const store = useContext(RootStoreContext)
    if (!store) throw new Error('useUserStore must be used within RootStoreProvider')
    return store.userStore
}

export function useCurrentUser(): UserInfo | null {
    return useUserStore().user
}

export function useSellerId(): number | null {
    return useUserStore().sellerId
}

export function useIsAuthenticated(): boolean {
    return useUserStore().isAuthenticated
}

export function useIsUserLoading(): boolean {
    return useUserStore().isLoading
}

export function useUserActions() {
    const store = useUserStore()
    return {
        login: () => store.login(),
        logout: () => store.logout(),
        refreshUser: () => store.refreshUser(),
    }
}
