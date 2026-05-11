'use client'

import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Button} from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {observer} from 'mobx-react-lite'
import {useRouter} from 'next/navigation'
import {useState} from 'react'
import {useCurrentUser, useUserActions} from '@/src/adapters/ui/react/stores'
import {AuthDialog} from '@/components/auth-dialog'
import {NotificationBell} from '@/components/notification-bell'

export const UserNav = observer(function UserNav() {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const user = useCurrentUser()
    const {login, logout} = useUserActions()

    const handleAuthSuccess = async () => {
        await login()
        setIsOpen(false)
        router.refresh()
    }

    const handleLogout = async () => {
        await logout()
        router.push('/')
        router.refresh()
    }

    if (!user) {
        return (
            <>
                <Button variant='default' size='sm' onClick={() => setIsOpen(true)}>
                    Войти
                </Button>
                <AuthDialog
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    onAuthSuccess={handleAuthSuccess}
                />
            </>
        )
    }

    const initials = user.first_name[0].toUpperCase() + user.last_name[0].toUpperCase()

    return (
        <div className='flex items-center gap-1'>
            <NotificationBell/>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
                        <Avatar className='h-8 w-8'>
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56' align='end' forceMount>
                <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                        <p className='text-sm font-medium leading-none'>
                            {user.first_name} {user.last_name}
                        </p>
                        <p className='text-xs leading-none text-muted-foreground'>
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={() => router.push('/profile')}
                        className='focus:bg-secondary focus:text-white'
                    >
                        Профиль
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => router.push('/orders-v2')}
                        className='focus:bg-secondary focus:text-white'
                    >
                        Мои заказы
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => router.push('/chats')}
                        className='focus:bg-secondary focus:text-white'
                    >
                        Согласования
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => router.push('/orders')}
                        className='focus:bg-secondary focus:text-white'
                    >
                        Старые заказы
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => router.push('/wishlist')}
                        className='focus:bg-secondary focus:text-white'
                    >
                        Избранное
                    </DropdownMenuItem>
                    {user.user_role === 'seller' && (
                        <DropdownMenuItem
                            onClick={() => router.push('/seller-dashboard')}
                            className='focus:bg-secondary focus:text-white'
                        >
                            Панель продавца
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        onClick={() => router.push('/settings')}
                        className='focus:bg-secondary focus:text-white'
                    >
                        Настройки
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator/>
                <DropdownMenuItem
                    className='focus:bg-secondary focus:text-white'
                    onClick={handleLogout}
                >
                    Выйти
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        </div>
    )
})
