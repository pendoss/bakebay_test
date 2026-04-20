'use client'

import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Separator} from '@/components/ui/separator'
import {CartItemRow} from '@/components/cart/cart-item-row'
import {observer} from 'mobx-react-lite'
import {useRouter} from 'next/navigation'
import {
    useCartActions,
    useCartCount,
    useCartItems,
    useCartRaw,
    useCartTotals,
    useCurrentUser
} from '@/src/adapters/ui/react/stores'
import {EmptyCartError, useCheckout} from '@/src/adapters/ui/react/hooks/use-checkout'
import {useToast} from '@/hooks/use-toast'
import {useAuthDialog} from '@/src/adapters/ui/react/providers/auth-dialog-provider'

export const ShoppingCart = observer(function ShoppingCart() {
    const router = useRouter()
    const {toast} = useToast()
    const items = useCartItems()
    const totals = useCartTotals()
    const itemsCount = useCartCount()
    const cart = useCartRaw()
    const {clear: clearCart, applyPromo} = useCartActions()
    const user = useCurrentUser()
    const {requireAuth} = useAuthDialog()
    const [promoCode, setPromoCode] = useState('')
    const checkout = useCheckout()
    const promoApplied = cart.promoCode !== null

    const performCheckout = async () => {
        try {
            const {customerOrderId} = await checkout()
            toast({
                title: 'Заказ успешно оформлен',
                description: `Ваш заказ #${customerOrderId} был успешно создан.`,
            })
            router.push('/orders-v2')
        } catch (err) {
            if (err instanceof EmptyCartError) {
                toast({
                    title: 'Корзина пуста',
                    description: 'Добавьте товары в корзину перед оформлением заказа.',
                    variant: 'destructive',
                })
                return
            }
            toast({
                title: 'Ошибка при оформлении заказа',
                description: err instanceof Error ? err.message : 'Произошла ошибка при оформлении заказа.',
                variant: 'destructive',
            })
        }
    }

    const applyPromoCode = () => {
        if (promoCode.trim() === '') return
        applyPromo(promoCode)
        toast({
            title: 'Промокод применен',
            description: 'Скидка 10% успешно применена к вашему заказу.',
        })
    }

    const {subtotal, discount, shipping, tax, total} = totals

    if (items.length === 0) {
        return (
            <div className='text-center py-12'>
                <h2 className='text-2xl font-semibold mb-4'>Ваша корзина пуста</h2>
                <p className='text-muted-foreground mb-6'>Похоже, вы еще не добавили сладости в корзину.</p>
                <Button onClick={() => router.push('/catalog')}>Продолжить покупки</Button>
            </div>
        )
    }

    return (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            <div className='lg:col-span-2 space-y-4'>
                {items.map((item) => (
                    <CartItemRow key={item.clientId} item={item}/>
                ))}

                <div className='flex justify-between items-center'>
                    <Button variant='outline' onClick={() => router.push('/catalog')}>
                        Продолжить покупки
                    </Button>
                    <Button
                        variant='ghost'
                        onClick={() => {
                            clearCart()
                            toast({
                                title: 'Корзина очищена',
                                description: 'Все товары были удалены из корзины.',
                            })
                        }}
                    >
                        Очистить корзину
                    </Button>
                </div>
            </div>

            <div className='lg:col-span-1'>
                <Card>
                    <CardHeader>
                        <CardTitle>Итого заказа</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='flex justify-between text-sm'>
                            <span>Подытог ({itemsCount} товаров)</span>
                            <span>{subtotal.toFixed(2)} руб.</span>
                        </div>

                        {promoApplied && (
                            <div className='flex justify-between text-sm text-green-600'>
                                <span>Скидка (10%)</span>
                                <span>-{discount.toFixed(2)} руб.</span>
                            </div>
                        )}

                        <div className='flex justify-between text-sm'>
                            <span>Доставка</span>
                            <span>{shipping === 0 ? 'Бесплатно' : `${shipping.toFixed(2)} руб.`}</span>
                        </div>

                        <div className='flex justify-between text-sm'>
                            <span>Налог</span>
                            <span>{tax.toFixed(2)} руб.</span>
                        </div>

                        <Separator/>

                        <div className='flex justify-between font-semibold'>
                            <span>Итого</span>
                            <span>{total.toFixed(2)} руб.</span>
                        </div>

                        <div className='pt-4'>
                            <div className='flex gap-2 mb-4'>
                                <Input
                                    placeholder='Промокод'
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                    disabled={promoApplied}
                                />
                                <Button variant='outline' onClick={applyPromoCode}
                                        disabled={promoApplied || promoCode.trim() === ''}>
                                    Применить
                                </Button>
                            </div>

                            {promoApplied &&
                                <div className='text-sm text-green-600 mb-4'>Промокод успешно применен!</div>
                            }
                            {user ? (
                                <Button className='w-full' onClick={performCheckout}>
                                    Перейти к оформлению
                                </Button>
                            ) : (
                                <Button
                                    className='w-full'
                                    onClick={() => requireAuth(performCheckout)}
                                >
                                    Зарегестрируйтесь или войдите, чтобы оформить заказ
                                </Button>
                            )}

                        </div>
                    </CardContent>
                    <CardFooter className='text-xs text-muted-foreground'>
                        <p>
                            Переходя к оформлению, вы соглашаетесь с нашими условиями обслуживания и политикой
                            конфиденциальности.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
})
