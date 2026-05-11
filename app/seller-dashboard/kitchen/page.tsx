'use client'

import {useMemo, useState} from 'react'
import {useSearchParams} from 'next/navigation'
import {ChevronLeft, Clock, CreditCard, Flame, MessageSquare, Package, Truck} from 'lucide-react'
import {cn} from '@/lib/utils'
import {Button} from '@/components/ui/button'
import {SellerOrderCard} from '@/components/seller-order-card'
import {CustomizationChat} from '@/components/customization-chat'
import {
    transitionSellerOrder,
} from '@/src/adapters/ui/react/hooks/use-customer-orders'
import {
    useSellerOrders,
    type SellerOrderWithCustomer,
} from '@/src/adapters/ui/react/hooks/use-seller-orders'

type Phase = 'negotiation' | 'awaiting_payment' | 'in_progress' | 'delivery' | 'done'

const PHASES: ReadonlyArray<{
    key: Phase
    label: string
    statuses: ReadonlyArray<string>
    icon: React.ComponentType<{ className?: string }>
}> = [
    {
        key: 'negotiation',
        label: 'Согласование',
        statuses: ['draft', 'pending_seller_review', 'negotiating', 'awaiting_customer_approval'],
        icon: MessageSquare,
    },
    {key: 'awaiting_payment', label: 'Ждёт оплаты', statuses: ['confirmed'], icon: CreditCard},
    {
        key: 'in_progress',
        label: 'В работе',
        statuses: ['paid', 'preparing_blocked', 'preparing', 'ready_to_ship'],
        icon: Flame,
    },
    {key: 'delivery', label: 'Доставка', statuses: ['delivering'], icon: Truck},
    {key: 'done', label: 'Завершено', statuses: ['delivered', 'cancelled'], icon: Clock},
]

const NEXT_ACTION: Record<string, { label: string; next: string; tone?: string } | null> = {
    pending_seller_review: {label: 'Принять в работу', next: 'confirmed'},
    paid: {label: 'Начать готовить', next: 'preparing', tone: 'primary'},
    preparing_blocked: {label: 'Ингредиенты докуплены', next: 'preparing'},
    preparing: {label: 'Готово к отправке', next: 'ready_to_ship', tone: 'primary'},
    ready_to_ship: {label: 'Передать курьеру', next: 'delivering'},
    delivering: {label: 'Отметить доставленным', next: 'delivered'},
    draft: null,
    negotiating: null,
    awaiting_customer_approval: null,
    confirmed: null,
    delivered: null,
    cancelled: null,
}

export default function SellerKitchenPage() {
    const {orders, loading, error, reload} = useSellerOrders()
    const search = useSearchParams()
    const initialId = search.get('sub') ? Number(search.get('sub')) : null
    const [phase, setPhase] = useState<Phase>('negotiation')
    const [selected, setSelected] = useState<number | null>(initialId)
    const [busyId, setBusyId] = useState<number | null>(null)

    const byPhase = useMemo(() => {
        const map = new Map<Phase, SellerOrderWithCustomer[]>()
        for (const p of PHASES) map.set(p.key, [])
        for (const o of orders) {
            const p = PHASES.find((pp) => pp.statuses.includes(o.status))
            if (!p) continue
            map.get(p.key)?.push(o)
        }
        return map
    }, [orders])

    const phaseOrders = byPhase.get(phase) ?? []

    const effectiveSelected = selected ?? phaseOrders[0]?.id ?? null
    const activeOrder = useMemo(
        () => orders.find((o) => o.id === effectiveSelected) ?? null,
        [orders, effectiveSelected],
    )

    const handleAction = async (id: number, next: string) => {
        setBusyId(id)
        try {
            await transitionSellerOrder(id, next)
            await reload()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Не удалось обновить статус')
        } finally {
            setBusyId(null)
        }
    }

    if (loading && orders.length === 0) {
        return <div className='py-16 text-center text-muted-foreground'>Загружаем кухню…</div>
    }
    if (error) {
        return (
            <div className='py-16 text-center'>
                <p className='text-destructive font-medium'>Не получилось загрузить: {error}</p>
                <Button variant='outline' className='mt-3' onClick={reload}>Повторить</Button>
            </div>
        )
    }

    return (
        <div className='flex flex-col gap-5 h-[calc(100vh-120px)] min-h-[620px]'>
            <PhaseTabs
                phase={phase}
                counts={Object.fromEntries(PHASES.map((p) => [p.key, byPhase.get(p.key)?.length ?? 0])) as Record<Phase, number>}
                onChange={(p) => {
                    setPhase(p)
                    setSelected(null)
                }}
            />

            <div className='grid grid-cols-1 md:grid-cols-[360px_1fr] gap-4 flex-1 min-h-0'>
                <OrdersList
                    orders={phaseOrders}
                    activeId={effectiveSelected}
                    onSelect={(id) => setSelected(id)}
                    phaseLabel={PHASES.find((p) => p.key === phase)?.label ?? ''}
                />

                <section
                    className={cn(
                        'rounded-2xl border border-lavender-dessert/40 bg-background overflow-hidden flex flex-col',
                        !activeOrder && 'hidden md:flex',
                        activeOrder && 'fixed inset-0 z-50 md:relative md:inset-auto md:z-auto',
                    )}
                >
                    {activeOrder ? (
                        <DetailView
                            order={activeOrder}
                            busy={busyId === activeOrder.id}
                            onAction={handleAction}
                            onReload={reload}
                            onBack={() => setSelected(null)}
                        />
                    ) : (
                        <EmptyDetail/>
                    )}
                </section>
            </div>
        </div>
    )
}

function PhaseTabs({
                       phase,
                       counts,
                       onChange,
                   }: {
    phase: Phase
    counts: Record<Phase, number>
    onChange: (p: Phase) => void
}) {
    return (
        <div className='-mx-4 md:mx-0 overflow-x-auto'>
            <div className='flex gap-2 px-4 md:px-0 pb-1 min-w-max md:min-w-0 md:flex-wrap'>
                {PHASES.map((p) => {
                    const Icon = p.icon
                    const active = p.key === phase
                    const count = counts[p.key] ?? 0
                    return (
                        <button
                            key={p.key}
                            type='button'
                            onClick={() => onChange(p.key)}
                            className={cn(
                                'group flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors whitespace-nowrap min-h-[44px]',
                                active
                                    ? 'bg-foreground text-background border-foreground shadow-sm'
                                    : 'bg-background border-lavender-dessert/50 hover:border-foreground/60',
                            )}
                        >
                            <Icon className='h-4 w-4'/>
                            <span className='font-medium'>{p.label}</span>
                            {count > 0 && (
                                <span
                                    className={cn(
                                        'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-mono',
                                        active ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground',
                                    )}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function OrdersList({
                        orders,
                        activeId,
                        onSelect,
                        phaseLabel,
                    }: {
    orders: SellerOrderWithCustomer[]
    activeId: number | null
    onSelect: (id: number) => void
    phaseLabel: string
}) {
    return (
        <aside
            className='rounded-2xl border border-lavender-dessert/40 bg-background flex flex-col overflow-hidden min-h-0'>
            <header className='px-4 py-3 border-b border-lavender-dessert/30 flex items-baseline justify-between'>
                <h3 className='font-semibold'>{phaseLabel}</h3>
                <span
                    className='text-xs text-muted-foreground font-mono'>{orders.length.toString().padStart(2, '0')}</span>
            </header>
            <div className='flex-1 overflow-y-auto divide-y divide-lavender-dessert/20'>
                {orders.length === 0 ? (
                    <div className='p-6 text-center text-sm text-muted-foreground'>В этой фазе пусто</div>
                ) : (
                    orders.map((o) => (
                        <OrderListItem
                            key={o.id}
                            order={o}
                            active={o.id === activeId}
                            onClick={() => onSelect(o.id)}
                        />
                    ))
                )}
            </div>
        </aside>
    )
}

function OrderListItem({order, active, onClick}: {
    order: SellerOrderWithCustomer;
    active: boolean;
    onClick: () => void
}) {
    const itemsPreview = order.items
        .slice(0, 2)
        .map((it) => `${it.quantity}× ${it.name}`)
        .join(', ')
    return (
        <button
            type='button'
            onClick={onClick}
            className={cn(
                'w-full text-left px-4 py-3 transition-colors min-h-[64px]',
                active ? 'bg-lavender-dessert/30' : 'hover:bg-muted/50',
            )}
        >
            <div className='flex items-baseline justify-between gap-3'>
                <span
                    className='font-medium text-sm truncate'>{order.customer?.name ?? `Клиент заказа #${order.customerOrderId}`}</span>
                <span className='text-xs text-muted-foreground font-mono tabular-nums shrink-0'>
                    {order.pricing.total.toFixed(0)} ₽
                </span>
            </div>
            <div className='text-xs text-muted-foreground truncate mt-0.5'>{itemsPreview}</div>
            <div className='text-[10px] text-muted-foreground/70 mt-1 font-mono'>
                #{order.id} · {new Date(order.createdAt).toLocaleDateString('ru-RU')}
            </div>
        </button>
    )
}

function DetailView({
                        order,
                        busy,
                        onAction,
                        onReload,
                        onBack,
                    }: {
    order: SellerOrderWithCustomer
    busy: boolean
    onAction: (id: number, next: string) => void
    onReload: () => void
    onBack: () => void
}) {
    const action = NEXT_ACTION[order.status]
    const thread = order.items.find((it) => it.customizationThreadId !== null)?.customizationThreadId ?? null

    return (
        <>
            <header
                className='px-4 md:px-6 py-4 border-b border-lavender-dessert/30 flex flex-wrap items-center gap-3 bg-gradient-to-r from-lemon-meringue/40 via-transparent to-transparent'>
                <Button variant='ghost' size='sm' className='md:hidden gap-1 -ml-2' onClick={onBack}>
                    <ChevronLeft className='h-4 w-4'/>
                    К списку
                </Button>
                <div className='min-w-0 flex-1'>
                    <h2 className='font-semibold truncate'>
                        {order.customer?.name ?? `Клиент #${order.customerOrderId}`}
                    </h2>
                    <p className='text-xs text-muted-foreground truncate'>
                        Подзаказ
                        #{order.id} · {order.items.length} {order.items.length === 1 ? 'позиция' : 'позиций'} · {order.pricing.total.toFixed(0)} ₽
                    </p>
                </div>
                {action && (
                    <Button
                        size='lg'
                        onClick={() => onAction(order.id, action.next)}
                        disabled={busy}
                        variant={action.tone === 'primary' ? 'default' : 'outline'}
                        className='gap-2'
                    >
                        <Package className='h-4 w-4'/>
                        {busy ? 'Обновляем…' : action.label}
                    </Button>
                )}
            </header>

            <div className='flex-1 overflow-hidden min-h-0'>
                {thread ? (
                    <div
                        className='h-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] divide-y lg:divide-y-0 lg:divide-x divide-lavender-dessert/30'>
                        <div className='overflow-y-auto p-4 md:p-6 space-y-4'>
                            <div className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                Подзаказ
                            </div>
                            <SellerOrderCard sub={order} viewerRole='seller' onChanged={onReload}/>
                        </div>
                        <div
                            className='overflow-y-auto p-4 md:p-6 space-y-3 bg-gradient-to-b from-lavender-dessert/10 to-transparent'>
                            <div className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                Чат согласования
                            </div>
                            <CustomizationChat
                                threadId={thread}
                                viewerRole='seller'
                                sellerOrderId={order.id}
                                onAfterCancel={onReload}
                            />
                        </div>
                    </div>
                ) : (
                    <div className='h-full overflow-y-auto p-4 md:p-6'>
                        <SellerOrderCard sub={order} viewerRole='seller' onChanged={onReload}/>
                    </div>
                )}
            </div>
        </>
    )
}

function EmptyDetail() {
    return (
        <div className='flex-1 grid place-items-center p-10 text-center'>
            <div className='max-w-sm space-y-2'>
                <div
                    className='mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-lavender-dessert/40'>
                    <Package className='h-5 w-5 text-secondary'/>
                </div>
                <h3 className='font-semibold'>Выберите подзаказ слева</h3>
                <p className='text-sm text-muted-foreground'>
                    Здесь откроется карточка с позициями, чатом согласования и кнопкой для следующего шага.
                </p>
            </div>
        </div>
    )
}

