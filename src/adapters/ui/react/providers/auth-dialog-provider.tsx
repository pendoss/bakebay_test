'use client'

import {createContext, type ReactNode, useCallback, useContext, useRef, useState} from 'react'
import {useRouter} from 'next/navigation'
import {AuthDialog} from '@/components/auth-dialog'
import {useUser} from '@/contexts/user-context'

type PendingAction = () => void | Promise<void>

interface AuthDialogContextValue {
    open: () => void
    requireAuth: (action: PendingAction) => void
}

const AuthDialogContext = createContext<AuthDialogContextValue | undefined>(undefined)

export function useAuthDialog() {
    const ctx = useContext(AuthDialogContext)
    if (!ctx) throw new Error('useAuthDialog должен использоваться внутри AuthDialogProvider')
    return ctx
}

export function AuthDialogProvider({children}: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const pendingRef = useRef<PendingAction | null>(null)
    const {user, login} = useUser()
    const router = useRouter()

    const open = useCallback(() => {
        pendingRef.current = null
        setIsOpen(true)
    }, [])

    const requireAuth = useCallback((action: PendingAction) => {
        if (user) {
            void action()
            return
        }
        pendingRef.current = action
        setIsOpen(true)
    }, [user])

    const handleOpenChange = useCallback((open: boolean) => {
        setIsOpen(open)
        if (!open) pendingRef.current = null
    }, [])

    const handleAuthSuccess = useCallback(async () => {
        await login()
        setIsOpen(false)
        router.refresh()
        const action = pendingRef.current
        pendingRef.current = null
        if (action) await action()
    }, [login, router])

    return (
        <AuthDialogContext.Provider value={{open, requireAuth}}>
            {children}
            <AuthDialog isOpen={isOpen} setIsOpen={handleOpenChange} onAuthSuccess={handleAuthSuccess}/>
        </AuthDialogContext.Provider>
    )
}
