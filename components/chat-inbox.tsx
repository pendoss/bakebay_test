'use client'

import {useMemo, useState} from 'react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {CustomizationChat} from '@/components/customization-chat'
import {useChatInbox, type ChatInboxItem} from '@/src/adapters/ui/react/hooks/use-chat-inbox'

const THREAD_STATUS_BADGE: Record<string, string> = {
    awaiting_seller_finalize: 'ждёт финализации',
    agreed: 'согласовано',
    rejected: 'отклонено',
}

const SUB_STATUS_LABEL: Record<string, string> = {
    draft: 'Черновик',
    pending_seller_review: 'Ждёт продавца',
    negotiating: 'Согласование',
    awaiting_customer_approval: 'Ждёт клиента',
    confirmed: 'Подтверждён',
    paid: 'Оплачен',
    preparing_blocked: 'Нужна докупка',
    preparing: 'Готовится',
    ready_to_ship: 'Готов к отправке',
    delivering: 'В доставке',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
}

interface ChatInboxProps {
    initialThreadId?: number | null
}

export function ChatInbox({initialThreadId = null}: ChatInboxProps) {
    const {payload, loading, error, reload} = useChatInbox()
    const [selected, setSelected] = useState<number | null>(initialThreadId)
    const [filter, setFilter] = useState<'open' | 'all'>('open')

    const threads = useMemo(() => payload?.threads ?? [], [payload])
    const visibleThreads = useMemo(() => {
        if (filter === 'all') return threads
        return threads.filter((t) => t.status === 'open')
    }, [threads, filter])

    const firstVisibleId = visibleThreads[0]?.threadId ?? null
    const effectiveSelected = selected ?? firstVisibleId
    const activeThread = useMemo(
        () => threads.find((t) => t.threadId === effectiveSelected) ?? null,
        [threads, effectiveSelected],
    )

    if (loading && !payload) {
        return <div className='py-16 text-center text-muted-foreground'>Загружаем чаты…</div>
    }
    if (error) {
        return (
            <div className='py-16 text-center'>
                <p className='text-destructive'>{error}</p>
                <Button variant='outline' className='mt-3' onClick={() => void reload()}>
                    Повторить
                </Button>
            </div>
        )
    }
    if (!payload) return null

    const viewerRole = payload.viewerRole

    return (
        <div className='grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-240px)] min-h-[520px]'>
            <aside className='rounded-xl border border-lavender-dessert/40 flex flex-col overflow-hidden bg-background'>
                <div className='flex items-center justify-between gap-2 border-b border-lavender-dessert/30 px-3 py-2'>
                    <div className='flex gap-1'>
                        <FilterChip active={filter === 'open'} onClick={() => setFilter('open')}>
                            Активные
                        </FilterChip>
                        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
                            Все
                        </FilterChip>
                    </div>
                    <span className='text-xs text-muted-foreground'>
                        {visibleThreads.length.toString().padStart(2, '0')}
                    </span>
                </div>

                <div className='flex-1 overflow-y-auto divide-y divide-lavender-dessert/20'>
                    {visibleThreads.length === 0 ? (
                        <div className='p-6 text-center text-sm text-muted-foreground space-y-2'>
                            <div>
                                {filter === 'open'
                                    ? 'Активных согласований пока нет'
                                    : 'Чатов пока нет'}
                            </div>
                            {viewerRole === 'seller' && payload.viewerSellerName && (
                                <div className='text-xs'>
                                    Вы — <span className='font-medium text-foreground'>{payload.viewerSellerName}</span>.
                                    Чаты появятся, когда клиент закажет ваш кастом-товар.
                                </div>
                            )}
                        </div>
                    ) : (
                        visibleThreads.map((t) => (
                            <ThreadListItem
                                key={t.threadId}
                                thread={t}
                                active={t.threadId === effectiveSelected}
                                viewerRole={viewerRole}
                                onClick={() => setSelected(t.threadId)}
                            />
                        ))
                    )}
                </div>
            </aside>

            <section
                className='rounded-xl border border-lavender-dessert/40 overflow-hidden bg-background flex flex-col'>
                {activeThread ? (
                    <>
                        <header className='border-b border-lavender-dessert/30 px-4 py-3'>
                            <div className='flex items-center justify-between gap-3'>
                                <div className='min-w-0'>
                                    <h3 className='font-semibold truncate'>{activeThread.counterpart}</h3>
                                    <p className='text-xs text-muted-foreground truncate'>
                                        {activeThread.quantity} × {activeThread.productName} · Подзаказ #
                                        {activeThread.sellerOrderId}
                                    </p>
                                </div>
                                <Badge variant='outline' className='shrink-0'>
                                    {SUB_STATUS_LABEL[activeThread.sellerOrderStatus] ?? activeThread.sellerOrderStatus}
                                </Badge>
                            </div>
                        </header>
                        <div className='flex-1 overflow-y-auto p-4'>
                            <CustomizationChat
                                key={activeThread.threadId}
                                threadId={activeThread.threadId}
                                viewerRole={viewerRole}
                                sellerOrderId={activeThread.sellerOrderId}
                                onAfterCancel={() => void reload()}
                            />
                        </div>
                    </>
                ) : (
                    <div className='flex-1 grid place-items-center p-8 text-center'>
                        <div>
                            <p className='font-medium'>Выберите чат слева</p>
                            <p className='text-sm text-muted-foreground mt-1'>
                                Здесь появятся сообщения, офферы и вложения из согласования.
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}

function FilterChip({active, children, onClick}: { active: boolean; children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type='button'
            onClick={onClick}
            className={[
                'rounded-full px-3 py-1 text-xs font-medium transition',
                active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80',
            ].join(' ')}
        >
            {children}
        </button>
    )
}

function ThreadListItem({
                            thread,
                            active,
                            viewerRole,
                            onClick,
                        }: {
    thread: ChatInboxItem
    active: boolean
    viewerRole: 'customer' | 'seller'
    onClick: () => void
}) {
    const last = thread.lastMessage
    const preview = last
        ? last.body || (last.hasAttachments ? '📎 вложение' : '—')
        : 'Сообщений пока нет — напишите первым'
    const lastIsFromMe = last?.author === viewerRole
    return (
        <button
            type='button'
            onClick={onClick}
            className={[
                'w-full text-left px-3 py-3 transition-colors focus:outline-none',
                active ? 'bg-lavender-dessert/30' : 'hover:bg-muted/60',
            ].join(' ')}
        >
            <div className='flex items-baseline justify-between gap-2'>
                <span className='font-medium text-sm truncate'>{thread.counterpart}</span>
                {last && (
                    <time className='text-[10px] text-muted-foreground shrink-0'>
                        {new Date(last.createdAt).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </time>
                )}
            </div>
            <p className='text-xs text-muted-foreground truncate mt-0.5'>
                {thread.quantity} × {thread.productName}
            </p>
            <p
                className={[
                    'text-xs truncate mt-1',
                    lastIsFromMe ? 'text-muted-foreground' : 'text-foreground',
                ].join(' ')}
            >
                {lastIsFromMe ? 'Вы: ' : ''}
                {preview}
            </p>
            <div className='flex items-center gap-1 mt-1'>
                <Badge variant='outline' className='text-[10px] py-0 h-4'>
                    {SUB_STATUS_LABEL[thread.sellerOrderStatus] ?? thread.sellerOrderStatus}
                </Badge>
                {thread.status !== 'open' && (
                    <Badge variant='secondary' className='text-[10px] py-0 h-4'>
                        {THREAD_STATUS_BADGE[thread.status] ?? thread.status}
                    </Badge>
                )}
            </div>
        </button>
    )
}
