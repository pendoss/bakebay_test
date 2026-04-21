'use client'

import {Suspense} from 'react'
import {useSearchParams} from 'next/navigation'
import {ChatInbox} from '@/components/chat-inbox'

function CustomerChatsContent() {
    const params = useSearchParams()
    const threadParam = params.get('thread')
    const initial = threadParam ? parseInt(threadParam, 10) : null

    return (
        <div className='container py-8 px-4 md:px-6 space-y-4'>
            <header>
                <h1 className='text-2xl font-bold tracking-tight'>Мои согласования</h1>
                <p className='text-sm text-muted-foreground'>
                    Чаты по кастом-позициям. Выберите заказ слева, чтобы обсудить детали с продавцом.
                </p>
            </header>
            <ChatInbox initialThreadId={initial}/>
        </div>
    )
}

export default function CustomerChatsPage() {
    return (
        <Suspense fallback={null}>
            <CustomerChatsContent/>
        </Suspense>
    )
}
