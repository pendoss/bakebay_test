'use client'

import {Separator} from '@/components/ui/separator'
import {SellerDashboardNav} from '@/components/seller-dashboard/seller-nav'
import {useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {Loader2} from 'lucide-react'
import {useUser} from '@/contexts/user-context'
import {useSellerNotifications} from '@/hooks/use-seller-notifications'
import {useSellerReviewNotifications} from '@/hooks/use-seller-review-notifications'

interface Props {
  children?: React.ReactNode
}

export default function SellerDashboardLayout({ children }: Props) {
  const router = useRouter()
  const {user, sellerId, isLoading} = useUser()

  // Поллинг новых заказов — уведомляет продавца раз в 30 с
  useSellerNotifications(sellerId)
  // Поллинг новых отзывов — уведомляет продавца раз в 60 с
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
      <div className='container py-8 px-4 md:px-6'>
        <div className='flex flex-col space-y-6'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Панель продавца</h1>
            <p className='text-muted-foreground'>Управляйте своими товарами, заказами и взаимодействием с клиентами</p>
          </div>
          <Separator/>
          <div className='flex flex-col md:flex-row gap-8'>
            <aside className='md:w-1/5'>
              <SellerDashboardNav/>
            </aside>
            <div className='flex-1'>{children}</div>
          </div>
        </div>
      </div>
  )
}
