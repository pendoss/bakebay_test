'use client'

import {useEffect} from 'react'
import {useRouter} from 'next/navigation'

export default function RedirectOrdersV2ToKitchen() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/seller-dashboard/kitchen')
    }, [router])
    return <div className='py-12 text-center text-sm text-muted-foreground'>Перенос в Кухню…</div>
}
