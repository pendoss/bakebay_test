'use client'

import {useSearchParams} from 'next/navigation'
import {ChatInbox} from '@/components/chat-inbox'

export default function SellerChatsPage() {
    const params = useSearchParams()
    const threadParam = params.get('thread')
    const initial = threadParam ? parseInt(threadParam, 10) : null

    return (
        <div className='space-y-4'>
            <header>
                <h2 className='text-2xl font-bold tracking-tight'>Согласования</h2>
                <p className='text-sm text-muted-foreground'>
                    Все чаты с клиентами по кастом-позициям в одном месте. Обновляется автоматически каждые 3 секунды.
                </p>
            </header>
            <ChatInbox initialThreadId={initial}/>
        </div>
    )
}
