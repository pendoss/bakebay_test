'use client'

import {useState} from 'react'
import {CreditCard, Shield, Sparkles} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {paySellerOrder} from '@/src/adapters/ui/react/hooks/use-customer-orders'

interface PaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sellerOrderId: number
    amount: number
    sellerName: string
    onPaid?: () => void
}

function formatCardNumber(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 4)
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function PaymentDialog({open, onOpenChange, sellerOrderId, amount, sellerName, onPaid}: PaymentDialogProps) {
    const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
    const [cardHolder, setCardHolder] = useState('IVAN IVANOV')
    const [expiry, setExpiry] = useState('12/28')
    const [cvc, setCvc] = useState('123')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)

    const handleSubmit = async () => {
        setBusy(true)
        setError(null)
        try {
            await paySellerOrder(sellerOrderId, {cardNumber, cardHolder, expiry, cvc})
            setDone(true)
            setTimeout(() => {
                onPaid?.()
                onOpenChange(false)
                setDone(false)
            }, 1200)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось оплатить')
        } finally {
            setBusy(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-md'>
                <DialogHeader>
                    <DialogTitle>Оплата подзаказа #{sellerOrderId}</DialogTitle>
                    <DialogDescription>
                        Оплата идёт отдельно по каждому продавцу. Сейчас — {sellerName}.
                    </DialogDescription>
                </DialogHeader>

                {done ? (
                    <div className='py-8 text-center space-y-3'>
                        <div
                            className='mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-mint-frosting/70'>
                            <Sparkles className='h-6 w-6 text-secondary'/>
                        </div>
                        <div className='text-lg font-semibold'>Оплата прошла</div>
                        <p className='text-sm text-muted-foreground'>
                            Продавец получит уведомление и начнёт приготовление.
                        </p>
                    </div>
                ) : (
                    <div className='space-y-4'>
                        <div
                            className='rounded-2xl bg-gradient-to-br from-lavender-dessert/80 to-caramel-light/80 p-4 text-secondary'>
                            <div
                                className='flex items-center justify-between text-xs uppercase tracking-wider opacity-80'>
                                <span>Сумма к оплате</span>
                                <CreditCard className='h-4 w-4'/>
                            </div>
                            <div className='mt-1 text-3xl font-semibold tabular-nums'>
                                {amount.toFixed(2)} ₽
                            </div>
                            <div className='mt-1 text-xs opacity-80'>
                                после оплаты продавец приступит к приготовлению
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <label className='text-xs font-medium text-muted-foreground'>Номер карты</label>
                            <Input
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                inputMode='numeric'
                                placeholder='4242 4242 4242 4242'
                                maxLength={19}
                                className='font-mono tracking-wider'
                            />
                        </div>

                        <div className='grid grid-cols-2 gap-3'>
                            <div className='space-y-2'>
                                <label className='text-xs font-medium text-muted-foreground'>Срок</label>
                                <Input
                                    value={expiry}
                                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                    inputMode='numeric'
                                    placeholder='MM/YY'
                                    maxLength={5}
                                    className='font-mono'
                                />
                            </div>
                            <div className='space-y-2'>
                                <label className='text-xs font-medium text-muted-foreground'>CVC</label>
                                <Input
                                    value={cvc}
                                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    inputMode='numeric'
                                    placeholder='123'
                                    maxLength={4}
                                    className='font-mono'
                                />
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <label className='text-xs font-medium text-muted-foreground'>Имя на карте</label>
                            <Input
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                placeholder='IVAN IVANOV'
                                className='font-mono tracking-wider'
                            />
                        </div>

                        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                            <Shield className='h-3.5 w-3.5'/>
                            Тестовая заглушка — реального списания нет. В будущем подключим платёжный шлюз.
                        </div>

                        {error &&
                            <div className='rounded-md bg-destructive/10 p-2 text-sm text-destructive'>{error}</div>}
                    </div>
                )}

                {!done && (
                    <DialogFooter>
                        <Button variant='ghost' onClick={() => onOpenChange(false)} disabled={busy}>
                            Отмена
                        </Button>
                        <Button onClick={handleSubmit} disabled={busy}>
                            {busy ? 'Оплачиваем…' : `Оплатить ${amount.toFixed(2)} ₽`}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
