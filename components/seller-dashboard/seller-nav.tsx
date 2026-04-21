'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {cn} from '@/lib/utils'
import {BarChart3, ChefHat, Package, Settings, Star, Warehouse} from 'lucide-react'
import {useChatInbox} from '@/src/adapters/ui/react/hooks/use-chat-inbox'

interface Route {
    href: string
    label: string
    shortLabel: string
    icon: React.ComponentType<{ className?: string }>
    primary?: boolean
}

const ROUTES: ReadonlyArray<Route> = [
    {href: '/seller-dashboard/kitchen', label: 'Кухня', shortLabel: 'Кухня', icon: ChefHat, primary: true},
    {href: '/seller-dashboard/products', label: 'Товары', shortLabel: 'Товары', icon: Package},
    {href: '/seller-dashboard/ingredients', label: 'Склад', shortLabel: 'Склад', icon: Warehouse},
    {href: '/seller-dashboard', label: 'Обзор', shortLabel: 'Обзор', icon: BarChart3},
    {href: '/seller-dashboard/reviews', label: 'Отзывы', shortLabel: 'Отзывы', icon: Star},
    {href: '/seller-dashboard/settings', label: 'Настройки', shortLabel: 'Настр.', icon: Settings},
]

function useKitchenBadgeCount(): number {
    const {payload} = useChatInbox()
    return (
        payload?.threads.filter((t) => t.status === 'open' || t.status === 'awaiting_seller_finalize').length ?? 0
    )
}

export function SellerDashboardNav() {
    const pathname = usePathname()
    const kitchenCount = useKitchenBadgeCount()

    return (
        <>
            {/* Desktop / tablet landscape: icon-rail, collapsed on md, expanded on xl */}
            <nav
                aria-label='Навигация продавца'
                className='hidden md:flex sticky top-4 flex-col gap-1 rounded-2xl border border-lavender-dessert/40 bg-background p-2 w-[60px] xl:w-[220px] transition-[width]'
            >
                {ROUTES.map((r) => {
                    const Icon = r.icon
                    const active =
                        r.href === '/seller-dashboard' ? pathname === r.href : pathname.startsWith(r.href)
                    const showBadge = r.href === '/seller-dashboard/kitchen' && kitchenCount > 0
                    return (
                        <Link
                            key={r.href}
                            href={r.href}
                            title={r.label}
                            className={cn(
                                'group relative flex items-center gap-3 rounded-xl transition-colors',
                                'h-12 px-3 xl:px-4',
                                active
                                    ? 'bg-foreground text-background'
                                    : 'text-foreground/70 hover:bg-muted hover:text-foreground',
                                r.primary && !active && 'text-foreground',
                            )}
                        >
                            <Icon className='h-5 w-5 shrink-0'/>
                            <span className='hidden xl:inline text-sm font-medium'>{r.label}</span>
                            {showBadge && (
                                <span
                                    className={cn(
                                        'absolute xl:static xl:ml-auto',
                                        'top-1.5 right-1.5 xl:top-auto xl:right-auto',
                                        'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-strawberry-cream/90 px-1.5 text-[11px] font-bold text-secondary',
                                    )}
                                >
                                    {kitchenCount > 9 ? '9+' : kitchenCount}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Mobile / tablet portrait: bottom tab bar with 5 primary destinations */}
            <nav
                aria-label='Нижняя навигация продавца'
                className='md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-lavender-dessert/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 pb-[env(safe-area-inset-bottom)]'
            >
                <div className='grid grid-cols-5 gap-1 px-2 py-1'>
                    {ROUTES.slice(0, 5).map((r) => {
                        const Icon = r.icon
                        const active =
                            r.href === '/seller-dashboard' ? pathname === r.href : pathname.startsWith(r.href)
                        const showBadge = r.href === '/seller-dashboard/kitchen' && kitchenCount > 0
                        return (
                            <Link
                                key={r.href}
                                href={r.href}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-0.5 rounded-lg py-2 min-h-[52px] text-[11px] font-medium transition-colors',
                                    active ? 'text-foreground' : 'text-muted-foreground',
                                )}
                            >
                                <Icon className={cn('h-5 w-5', active && 'scale-110 transition-transform')}/>
                                <span>{r.shortLabel}</span>
                                {active && (
                                    <span
                                        aria-hidden
                                        className='absolute -top-0.5 h-1 w-8 rounded-full bg-foreground'
                                    />
                                )}
                                {showBadge && (
                                    <span
                                        className='absolute top-1 right-3 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-strawberry-cream px-1 text-[10px] font-bold text-secondary'>
                                        {kitchenCount > 9 ? '9+' : kitchenCount}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
