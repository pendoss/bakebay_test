'use client'

import {useState} from 'react'
import Link from 'next/link'
import {CreditCard, ExternalLink, MessageSquare, Undo2} from 'lucide-react'
import {Card, CardContent, CardFooter, CardHeader} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Button} from '@/components/ui/button'
import {CustomizationChat} from '@/components/customization-chat'
import {PaymentDialog} from '@/components/payment-dialog'
import {StockReportPanel} from '@/components/stock-report-panel'
import type {SellerOrderDTO} from '@/src/adapters/ui/react/hooks/use-customer-orders'
import {approveRefund, requestRefund} from '@/src/adapters/ui/react/hooks/use-customer-orders'
import {Textarea} from '@/components/ui/textarea'

export function chatInboxHref(viewerRole: 'customer' | 'seller', threadId: number): string {
    const base = viewerRole === 'seller' ? '/seller-dashboard/chats' : '/chats'
    return `${base}?thread=${threadId}`
}

const STATUS_LABEL: Record<string, string> = {
    draft: 'Черновик',
    pending_seller_review: 'Ожидает продавца',
    negotiating: 'Согласование',
    awaiting_customer_approval: 'Ожидает вашего ответа',
    confirmed: 'Подтверждён · ожидает оплаты',
    paid: 'Оплачен',
    preparing_blocked: 'Готовится · нужна докупка',
    preparing: 'Готовится',
    ready_to_ship: 'Готов к отправке',
    delivering: 'В доставке',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
}

const STATUS_TONE: Record<string, string> = {
    pending_seller_review: 'bg-lemon-meringue text-secondary',
    negotiating: 'bg-lavender-dessert text-secondary',
    awaiting_customer_approval: 'bg-lavender-dessert text-secondary',
    confirmed: 'bg-mint-frosting text-secondary',
    paid: 'bg-mint-frosting text-secondary',
    preparing_blocked: 'bg-caramel-light text-secondary',
    preparing: 'bg-mint-frosting text-secondary',
    ready_to_ship: 'bg-mint-frosting text-secondary',
    delivering: 'bg-caramel-light text-secondary',
    delivered: 'bg-strawberry-cream text-secondary',
    cancelled: 'bg-muted text-muted-foreground',
}

interface SellerOrderCardProps {
    sub: SellerOrderDTO
    viewerRole?: 'customer' | 'seller'
    onChanged?: () => void
}

export function SellerOrderCard({sub, viewerRole = 'customer', onChanged}: SellerOrderCardProps) {
    const tone = STATUS_TONE[sub.status] ?? 'bg-muted text-muted-foreground'
    const label = STATUS_LABEL[sub.status] ?? sub.status
    const [openThread, setOpenThread] = useState<number | null>(null)
    const [payOpen, setPayOpen] = useState(false)
    const firstThreadId = sub.items.find((it) => it.customizationThreadId !== null)?.customizationThreadId ?? null
    const canPay = viewerRole === 'customer' && sub.status === 'confirmed'
    const showStockForSeller =
        viewerRole === 'seller' &&
        (sub.status === 'paid' || sub.status === 'preparing' || sub.status === 'preparing_blocked')
    const refundEligibleStatuses = ['paid', 'preparing_blocked', 'preparing', 'ready_to_ship']
    const canRequestRefund =
        refundEligibleStatuses.includes(sub.status) && sub.refundState !== 'requested' && sub.refundState !== 'approved'
    const [refundOpen, setRefundOpen] = useState(false)
    const [refundReason, setRefundReason] = useState('')
    const [refundBusy, setRefundBusy] = useState(false)
    async function submitRefund() {
        if (!refundReason.trim()) return
        setRefundBusy(true)
        try {
            await requestRefund(sub.id, refundReason.trim())
            setRefundOpen(false)
            setRefundReason('')
            onChanged?.()
        } finally {
            setRefundBusy(false)
        }
    }

    return (
        <Card className='overflow-hidden border-lavender-dessert/30'>
            <CardHeader className='p-4 pb-0'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <h4 className='font-semibold'>Продавец #{sub.sellerId}</h4>
                        <Badge className={tone}>{label}</Badge>
                    </div>
                    <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                        {firstThreadId !== null && (
                            <Link
                                href={chatInboxHref(viewerRole, firstThreadId)}
                                className='inline-flex items-center gap-1 hover:text-foreground'
                                title='Открыть чат согласования'
                            >
                                <MessageSquare className='h-4 w-4'/>
                                <span className='hidden sm:inline'>Чат</span>
                            </Link>
                        )}
                        <span>Подзаказ #{sub.id}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className='p-4 space-y-2'>
                <ul className='space-y-2 text-sm'>
                    {sub.items.map((item) => {
                        const isOpen = openThread === item.customizationThreadId
                        return (
                            <li key={item.id} className='rounded border border-lavender-dessert/20 p-2'>
                                <div className='flex items-center justify-between'>
                                    <span>
                                        {item.quantity} × {item.name || `Товар #${item.productId ?? '?'}`}
                                    </span>
                                    <span>{(item.quantity * item.unitPrice).toFixed(2)} руб.</span>
                                </div>
                                {item.customizationThreadId !== null && (
                                    <div className='mt-2 flex flex-wrap gap-2'>
                                        <Button
                                            size='sm'
                                            variant='outline'
                                            onClick={() =>
                                                setOpenThread(
                                                    isOpen ? null : item.customizationThreadId,
                                                )
                                            }
                                        >
                                            <MessageSquare className='h-4 w-4 mr-1'/>
                                            {isOpen ? 'Скрыть чат' : 'Открыть согласование'}
                                        </Button>
                                        <Link
                                            href={chatInboxHref(viewerRole, item.customizationThreadId)}
                                            className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground self-center'
                                        >
                                            <ExternalLink className='h-3 w-3'/>
                                            В отдельной вкладке
                                        </Link>
                                    </div>
                                )}
                                {isOpen && item.customizationThreadId !== null && (
                                    <div className='mt-3'>
                                        <CustomizationChat
                                            threadId={item.customizationThreadId}
                                            viewerRole={viewerRole}
                                            sellerOrderId={sub.id}
                                            onAfterCancel={onChanged}
                                        />
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ul>
                {sub.status === 'cancelled' && sub.cancelReason && (
                    <p className='text-sm text-muted-foreground'>Причина отмены: {sub.cancelReason}</p>
                )}
                {showStockForSeller && (
                    <StockReportPanel
                        sellerOrderId={sub.id}
                        title={sub.status === 'preparing_blocked' ? 'Нужна докупка' : 'Резерв по складу'}
                    />
                )}
                {sub.refundState === 'requested' && (
                    <div className='rounded border border-caramel-light/60 bg-caramel-light/20 p-3 text-sm space-y-2'>
                        <div className='font-medium'>Запрошен возврат</div>
                        {sub.refundReason && (
                            <div className='text-xs text-muted-foreground'>Причина: {sub.refundReason}</div>
                        )}
                        {viewerRole === 'seller' && (
                            <Button
                                size='sm'
                                variant='destructive'
                                onClick={async () => {
                                    await approveRefund(sub.id)
                                    onChanged?.()
                                }}
                            >
                                Одобрить возврат
                            </Button>
                        )}
                    </div>
                )}
                {sub.refundState === 'approved' && (
                    <div className='rounded border p-3 text-sm text-muted-foreground'>Возврат оформлен.</div>
                )}
                {canRequestRefund && (
                    <div className='pt-1'>
                        {refundOpen ? (
                            <div className='rounded border border-destructive/30 p-3 space-y-2'>
                                <p className='text-sm'>
                                    После подтверждения продавец получит запрос на возврат. Статус подзаказа обновится,
                                    когда возврат одобрят.
                                </p>
                                <Textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder='Опишите причину возврата'
                                />
                                <div className='flex gap-2'>
                                    <Button
                                        size='sm'
                                        variant='destructive'
                                        onClick={submitRefund}
                                        disabled={refundBusy || !refundReason.trim()}
                                    >
                                        Запросить возврат
                                    </Button>
                                    <Button size='sm' variant='outline' onClick={() => setRefundOpen(false)}>
                                        Отмена
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button size='sm' variant='outline' onClick={() => setRefundOpen(true)} className='gap-1'>
                                <Undo2 className='h-4 w-4'/>
                                Запросить возврат
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
            {canPay && (
                <div
                    className='border-t border-lavender-dessert/30 bg-gradient-to-r from-mint-frosting/30 via-lemon-meringue/20 to-lavender-dessert/20 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between'>
                    <div className='text-sm'>
                        <div className='font-semibold'>Готово к оплате</div>
                        <div className='text-xs text-muted-foreground'>
                            Продавец принял условия. После оплаты начнёт готовить.
                        </div>
                    </div>
                    <Button size='sm' onClick={() => setPayOpen(true)} className='gap-2'>
                        <CreditCard className='h-4 w-4'/>
                        Оплатить {sub.pricing.total.toFixed(2)} ₽
                    </Button>
                </div>
            )}
            <Separator className='bg-lavender-dessert/30'/>
            <CardFooter className='p-4 flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>
                    Комиссия: {(sub.pricing.commissionRate * 100).toFixed(0)}%
                </span>
                <span className='font-semibold'>{sub.pricing.total.toFixed(2)} руб.</span>
            </CardFooter>
            {canPay && (
                <PaymentDialog
                    open={payOpen}
                    onOpenChange={setPayOpen}
                    sellerOrderId={sub.id}
                    amount={sub.pricing.total}
                    sellerName={`Продавец #${sub.sellerId}`}
                    onPaid={onChanged}
                />
            )}
        </Card>
    )
}
