'use client'

import {useRouter} from 'next/navigation'
import type {Router} from '@/src/application/ports/router'

export function useNextRouter(): Router {
    const router = useRouter()
    return {
        push: (path: string) => router.push(path),
        replace: (path: string) => router.replace(path),
        refresh: () => router.refresh(),
        back: () => router.back(),
    }
}
