'use client'

import {SellerDashboardNav} from '@/components/seller-dashboard/seller-nav'
import {useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {Loader2} from 'lucide-react'
import {observer} from 'mobx-react-lite'
import {useCurrentUser, useIsUserLoading, useSellerId} from '@/src/adapters/ui/react/stores'
import {useSellerNotifications} from '@/hooks/use-seller-notifications'
import {useSellerReviewNotifications} from '@/hooks/use-seller-review-notifications'
import {NotificationBell} from '@/components/notification-bell'

interface Props {
    children?: React.ReactNode
}

const SellerDashboardLayout = observer(function SellerDashboardLayout({children}: Props) {
    const router = useRouter()
    const user = useCurrentUser()
    const sellerId = useSellerId()
    const isLoading = useIsUserLoading()

    useSellerNotifications(sellerId)
    useSellerReviewNotifications(sellerId)

    useEffect(() => {
        if (isLoading) return
        if (!user) {
            router.replace('/')
            return
        }
        if (user.user_role !== 'seller') {
            router.replace('/sellers?tab=become')
        }
    }, [user, isLoading, router])

    if (isLoading) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <div className='flex flex-col items-center space-y-4'>
                    <Loader2 className='h-12 w-12 animate-spin text-primary'/>
                    <p className='text-lg font-medium'>Проверка доступа...</p>
                </div>
            </div>
        )
    }

    if (!user || user.user_role !== 'seller') {
        return null
    }

    return (
        <div className='min-h-screen pb-[88px] md:pb-0'>
            <div className='mx-auto max-w-[1440px] px-3 md:px-5 py-4 md:py-5'>
                <div className='flex flex-col md:flex-row gap-4 md:gap-5'>
                    <aside className='shrink-0'>
                        <SellerDashboardNav/>
                    </aside>
                    <main className='flex-1 min-w-0'>
                        <div className='flex items-center justify-end mb-3'>
                            <NotificationBell/>
                        </div>
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
})
export default SellerDashboardLayout
