'use client'

import {useMemo, useState} from 'react'
import Link from 'next/link'
import {
    ArrowRight,
    CheckCircle2,
    ChefHat,
    CircleSlash,
    CreditCard,
    MessageCircleMore,
    MessageSquare,
    PackageCheck,
    Timer,
    Truck,
} from 'lucide-react'
import {cn} from '@/lib/utils'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Sheet, SheetContent, SheetHeader, SheetTitle} from '@/components/ui/sheet'
import {PaymentDialog} from '@/components/payment-dialog'
import {
    useCustomerOrders,
    type CustomerOrderDTO,
    type SellerOrderDTO,
} from '@/src/adapters/ui/react/hooks/use-customer-orders'

type BucketKey = 'active' | 'archive' | 'cancelled'
const BUCKETS: ReadonlyArray<{ key: BucketKey; label: string; hint: string }> = [
    {key: 'active', label: 'В работе', hint: 'Обсуждаем, платим, готовим, везём'},
    {key: 'archive', label: 'Получены', hint: 'Всё приехало — можно повторить'},
    {key: 'cancelled', label: 'Отменённые', hint: 'Архив несостоявшихся'},
]

const DERIVED_LABEL: Record<string, string> = {
    negotiating: 'Согласование',
    awaiting_payment: 'Ожидает оплаты',
    partially_paid: 'Частично оплачен',
    in_fulfillment: 'Готовится',
    partially_delivered: 'Частично доставлен',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
    partially_cancelled: 'Частично отменён',
}

const DERIVED_TONE: Record<string, string> = {
    negotiating: 'bg-lavender-dessert text-secondary',
    awaiting_payment: 'bg-lemon-meringue text-secondary',
    partially_paid: 'bg-lemon-meringue text-secondary',
    in_fulfillment: 'bg-mint-frosting text-secondary',
    partially_delivered: 'bg-mint-frosting text-secondary',
    delivered: 'bg-strawberry-cream text-secondary',
    cancelled: 'bg-muted text-muted-foreground',
    partially_cancelled: 'bg-muted text-muted-foreground',
}

const SUB_STATUS_LABEL: Record<string, string> = {
    draft: 'Черновик',
    pending_seller_review: 'Ждёт продавца',
    negotiating: 'Обсуждение',
    awaiting_customer_approval: 'Ждём вашего ответа',
    confirmed: 'Готов к оплате',
    paid: 'Оплачен',
    preparing_blocked: 'Ждёт пополнения склада',
    preparing: 'Готовится',
    ready_to_ship: 'Готов к отправке',
    delivering: 'В пути',
    delivered: 'Получен',
    cancelled: 'Отменён',
}

function bucketOf(order: CustomerOrderDTO): BucketKey {
    if (order.derivedStatus === 'delivered') return 'archive'
    if (order.derivedStatus === 'cancelled') return 'cancelled'
    return 'active'
}

export default function OrdersV2Page() {
    const {orders, loading, error, reload} = useCustomerOrders()
    const [bucket, setBucket] = useState<BucketKey>('active')
    const [openId, setOpenId] = useState<number | null>(null)

    const buckets = useMemo(() => {
        const m = {
            active: [] as CustomerOrderDTO[],
            archive: [] as CustomerOrderDTO[],
            cancelled: [] as CustomerOrderDTO[],
        }
        for (const o of orders) m[bucketOf(o)].push(o)
        for (const key of Object.keys(m) as BucketKey[]) {
            m[key].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }
        return m
    }, [orders])

    const visible = buckets[bucket]
    const active = orders.find((o) => o.id === openId) ?? null

    if (loading && orders.length === 0) {
        return <div className='container py-16 text-center text-sm text-muted-foreground'>Загрузка…</div>
    }
    if (error) {
        return (
            <div className='container py-16 text-center space-y-3'>
                <p className='text-destructive'>{error}</p>
                <Button variant='outline' onClick={reload}>Повторить</Button>
            </div>
        )
    }

    return (
        <div className='container py-8 px-4 md:px-6 space-y-6'>
            <header className='flex flex-col sm:flex-row sm:items-end justify-between gap-3'>
                <div>
                    <h1 className='text-2xl font-bold'>Мои заказы</h1>
                    <p className='text-sm text-muted-foreground'>
                        Заказ может быть разделён на несколько продавцов — у каждого свой статус.
                    </p>
                </div>
                <Button asChild variant='outline' size='sm'>
                    <Link href='/chats' className='gap-2'>
                        <MessageSquare className='h-4 w-4'/>
                        Все согласования
                    </Link>
                </Button>
            </header>

            <nav aria-label='Фильтр заказов' className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
                {BUCKETS.map((b) => {
                    const count = buckets[b.key].length
                    const isActive = b.key === bucket
                    return (
                        <button
                            key={b.key}
                            type='button'
                            onClick={() => setBucket(b.key)}
                            className={cn(
                                'flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors min-h-[64px]',
                                isActive
                                    ? 'bg-secondary text-white border-secondary'
                                    : 'bg-background border-lavender-dessert/60 hover:border-secondary',
                            )}
                        >
                            <div className='min-w-0'>
                                <div className='font-medium'>{b.label}</div>
                                <div
                                    className={cn('text-xs mt-0.5', isActive ? 'opacity-80' : 'text-muted-foreground')}>
                                    {b.hint}
                                </div>
                            </div>
                            <div
                                className={cn('text-sm font-mono tabular-nums', isActive ? '' : 'text-muted-foreground')}>
                                {count.toString().padStart(2, '0')}
                            </div>
                        </button>
                    )
                })}
            </nav>

            <section className='space-y-3'>
                {visible.length === 0 ? (
                    <EmptyState bucket={bucket}/>
                ) : (
                    visible.map((order) => (
                        <OrderRow key={order.id} order={order} onOpen={() => setOpenId(order.id)}/>
                    ))
                )}
            </section>

            <Sheet open={active !== null} onOpenChange={(v) => !v && setOpenId(null)}>
                <SheetContent side='right' className='w-full sm:max-w-xl p-0 overflow-y-auto'>
                    <SheetHeader className='sr-only'>
                        <SheetTitle>Детали заказа</SheetTitle>
                    </SheetHeader>
                    {active && <OrderDetail order={active} onReload={reload}/>}
                </SheetContent>
            </Sheet>
        </div>
    )
}

function EmptyState({bucket}: { bucket: BucketKey }) {
    const lines: Record<BucketKey, { title: string; body: string }> = {
        active: {title: 'Активных заказов нет', body: 'Откройте каталог — там свежая выпечка.'},
        archive: {title: 'Доставленных пока нет', body: 'Первый полученный заказ попадёт сюда.'},
        cancelled: {title: 'Отменённых нет', body: 'И пусть так и остаётся.'},
    }
    const l = lines[bucket]
    return (
        <div className='mx-auto max-w-md text-center py-12 px-6 space-y-3'>
            <div
                className='mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                <ChefHat className='h-5 w-5'/>
            </div>
            <h3 className='text-lg font-semibold'>{l.title}</h3>
            <p className='text-sm text-muted-foreground'>{l.body}</p>
            <Button asChild>
                <Link href='/catalog'>В каталог</Link>
            </Button>
        </div>
    )
}

function OrderRow({order, onOpen}: { order: CustomerOrderDTO; onOpen: () => void }) {
    const total = order.sellerOrders.reduce((s, x) => s + x.pricing.total, 0)
    const sellersPreview = order.sellerOrders
        .map((s) => s.sellerName ?? `Продавец #${s.sellerId}`)
        .slice(0, 2)
        .join(', ')
    const moreSellers = order.sellerOrders.length > 2 ? ` +${order.sellerOrders.length - 2}` : ''
    const cta = pickCTA(order)
    const derivedLabel = DERIVED_LABEL[order.derivedStatus] ?? order.derivedStatus
    const tone = DERIVED_TONE[order.derivedStatus] ?? 'bg-muted text-muted-foreground'
    const items = order.sellerOrders.flatMap((s) => s.items)
    const itemsPreview = items
        .slice(0, 3)
        .map((it) => `${it.quantity}× ${it.name}`)
        .join(', ')
    const itemsMore = items.length > 3 ? ` и ещё ${items.length - 3}` : ''

    return (
        <button
            type='button'
            onClick={onOpen}
            className='w-full text-left rounded-lg border border-lavender-dessert/40 bg-background p-4 hover:border-secondary transition-colors'
        >
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2 mb-1'>
                        <span className='text-xs text-muted-foreground font-mono'>
                            Заказ № {order.id.toString().padStart(4, '0')}
                        </span>
                        <Badge className={cn('text-xs', tone)}>{derivedLabel}</Badge>
                        <span className='text-xs text-muted-foreground'>
                            {new Date(order.createdAt).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'})}
                        </span>
                    </div>
                    <div className='font-semibold truncate'>
                        {sellersPreview}
                        {moreSellers && <span className='text-muted-foreground font-normal'>{moreSellers}</span>}
                    </div>
                    <div className='text-sm text-muted-foreground truncate mt-0.5'>
                        {itemsPreview}
                        {itemsMore && <span>{itemsMore}</span>}
                    </div>
                </div>
                <div className='flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2 shrink-0'>
                    <div className='font-semibold tabular-nums'>{total.toFixed(2)} руб.</div>
                    <div
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium',
                            cta.tone === 'primary' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                        )}
                    >
                        {cta.icon}
                        <span>{cta.label}</span>
                        <ArrowRight className='h-3 w-3 opacity-60'/>
                    </div>
                </div>
            </div>
        </button>
    )
}

function pickCTA(order: CustomerOrderDTO): { label: string; tone: 'primary' | 'ghost'; icon: React.ReactNode } {
    const subs = order.sellerOrders
    const needsAnswer = subs.find((s) => s.status === 'awaiting_customer_approval')
    if (needsAnswer) return {label: 'Ответить', tone: 'primary', icon: <MessageCircleMore className='h-3.5 w-3.5'/>}
    const toPay = subs.find((s) => s.status === 'confirmed')
    if (toPay) return {
        label: `Оплатить ${toPay.pricing.total.toFixed(0)} ₽`,
        tone: 'primary',
        icon: <CreditCard className='h-3.5 w-3.5'/>
    }
    if (order.derivedStatus === 'delivered') return {
        label: 'Повторить',
        tone: 'ghost',
        icon: <PackageCheck className='h-3.5 w-3.5'/>
    }
    if (order.derivedStatus === 'cancelled') return {
        label: 'Посмотреть',
        tone: 'ghost',
        icon: <CircleSlash className='h-3.5 w-3.5'/>
    }
    if (order.derivedStatus === 'negotiating') return {
        label: 'Открыть чат',
        tone: 'ghost',
        icon: <MessageCircleMore className='h-3.5 w-3.5'/>
    }
    if (order.derivedStatus === 'in_fulfillment') return {
        label: 'Отследить',
        tone: 'ghost',
        icon: <Truck className='h-3.5 w-3.5'/>
    }
    if (order.derivedStatus === 'partially_delivered') return {
        label: 'Отследить',
        tone: 'ghost',
        icon: <Truck className='h-3.5 w-3.5'/>
    }
    return {label: 'Открыть', tone: 'ghost', icon: <Timer className='h-3.5 w-3.5'/>}
}

function OrderDetail({order, onReload}: { order: CustomerOrderDTO; onReload: () => void }) {
    const total = order.sellerOrders.reduce((s, x) => s + x.pricing.total, 0)
    const derivedLabel = DERIVED_LABEL[order.derivedStatus] ?? order.derivedStatus
    return (
        <div className='p-6 space-y-5'>
            <div>
                <div className='text-xs text-muted-foreground font-mono'>
                    Заказ № {order.id.toString().padStart(4, '0')}
                </div>
                <h2 className='text-xl font-bold mt-1'>{derivedLabel}</h2>
                <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1'>
                    <span>
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </span>
                    <span>·</span>
                    <span className='truncate'>{order.address}</span>
                </div>
            </div>

            <Timeline derivedStatus={order.derivedStatus}/>

            <Separator/>

            <div className='space-y-4'>
                {order.sellerOrders.map((sub) => (
                    <SubOrderCard key={sub.id} sub={sub} onReload={onReload}/>
                ))}
            </div>

            <Separator/>

            <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Итого</span>
                <span className='font-semibold tabular-nums'>{total.toFixed(2)} руб.</span>
            </div>
        </div>
    )
}

function Timeline({derivedStatus}: { derivedStatus: string }) {
    const steps = [
        {key: 'negotiating', label: 'Согласование'},
        {key: 'awaiting_payment', label: 'Оплата'},
        {key: 'in_fulfillment', label: 'Готовка'},
        {key: 'partially_delivered', label: 'Доставка'},
        {key: 'delivered', label: 'Получено'},
    ]
    const idx = steps.findIndex((s) => s.key === derivedStatus)
    const position = derivedStatus === 'delivered' ? 4 : idx === -1 ? 2 : idx
    return (
        <ol className='grid grid-cols-5 gap-1 text-center'>
            {steps.map((step, i) => {
                const done = i < position
                const isActive = i === position
                return (
                    <li key={step.key} className='flex flex-col items-center gap-1.5'>
                        <span
                            className={cn(
                                'h-6 w-6 rounded-full grid place-items-center text-[10px] font-bold border',
                                done && 'bg-secondary text-white border-secondary',
                                isActive && !done && 'bg-primary text-primary-foreground border-primary',
                                !done && !isActive && 'bg-muted text-muted-foreground border-transparent',
                            )}
                        >
                            {done ? <CheckCircle2 className='h-3 w-3'/> : i + 1}
                        </span>
                        <span
                            className={cn(
                                'text-[10px] leading-tight',
                                done || isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
                            )}
                        >
                            {step.label}
                        </span>
                    </li>
                )
            })}
        </ol>
    )
}

function SubOrderCard({sub, onReload}: { sub: SellerOrderDTO; onReload: () => void }) {
    const [payOpen, setPayOpen] = useState(false)
    const thread = sub.items.find((i) => i.customizationThreadId !== null)?.customizationThreadId ?? null
    const label = SUB_STATUS_LABEL[sub.status] ?? sub.status
    const canPay = sub.status === 'confirmed'
    const sellerName = sub.sellerName ?? `Продавец #${sub.sellerId}`

    return (
        <article className='rounded-lg border border-lavender-dessert/40 bg-background p-4 space-y-3'>
            <header className='flex items-center justify-between gap-3'>
                <div className='flex items-center gap-3 min-w-0'>
                    <div
                        className='h-10 w-10 rounded-full bg-secondary text-white grid place-items-center text-sm font-bold shrink-0'>
                        {sellerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className='min-w-0'>
                        <div className='font-semibold truncate'>{sellerName}</div>
                        <Badge variant='secondary' className='text-xs mt-0.5'>{label}</Badge>
                    </div>
                </div>
                <div className='font-semibold tabular-nums shrink-0'>{sub.pricing.total.toFixed(2)} руб.</div>
            </header>

            <ul className='space-y-1 text-sm'>
                {sub.items.map((it) => (
                    <li key={it.id} className='flex items-baseline justify-between gap-3'>
                        <span className='truncate'>
                            <span className='text-muted-foreground tabular-nums'>{it.quantity}×</span>{' '}
                            {it.name || `Товар #${it.productId}`}
                        </span>
                        <span className='text-muted-foreground tabular-nums shrink-0'>
                            {(it.quantity * it.unitPrice).toFixed(2)} руб.
                        </span>
                    </li>
                ))}
            </ul>

            <div className='flex flex-wrap gap-2'>
                {thread !== null && (
                    <Button asChild variant='outline' size='sm' className='gap-1.5'>
                        <Link href={`/chats?thread=${thread}`}>
                            <MessageCircleMore className='h-4 w-4'/>
                            Открыть чат
                        </Link>
                    </Button>
                )}
                {canPay && (
                    <Button size='sm' onClick={() => setPayOpen(true)} className='gap-1.5'>
                        <CreditCard className='h-4 w-4'/>
                        Оплатить {sub.pricing.total.toFixed(0)} ₽
                    </Button>
                )}
            </div>

            {sub.status === 'cancelled' && sub.cancelReason && (
                <div className='text-xs text-muted-foreground bg-muted/50 rounded-md p-2'>
                    Причина отмены: {sub.cancelReason}
                </div>
            )}

            {canPay && (
                <PaymentDialog
                    open={payOpen}
                    onOpenChange={setPayOpen}
                    sellerOrderId={sub.id}
                    amount={sub.pricing.total}
                    sellerName={sellerName}
                    onPaid={onReload}
                />
            )}
        </article>
    )
}
