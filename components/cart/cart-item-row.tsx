'use client'

import Image from 'next/image'
import {useMemo, useState} from 'react'
import {Minus, Pencil, Plus, Trash2} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import {cartLineId, type CartItem, type CartItemOptionSelection} from '@/src/domain/cart'
import {useCartActions} from '@/src/adapters/ui/react/stores'
import {useProductOptions} from '@/src/adapters/ui/react/hooks/use-product-options'

interface Props {
    item: CartItem
}

export function CartItemRow({item}: Props) {
    const lineId = cartLineId(item)
    const {updateQuantity, removeItem} = useCartActions()
    const [editing, setEditing] = useState(false)

    return (
        <Card className='overflow-hidden'>
            <div className='flex flex-col sm:flex-row'>
                <div className='w-full sm:w-32 h-32 relative shrink-0'>
                    <Image src={item.image || '/placeholder.svg'} alt={item.name} fill className='object-cover'/>
                </div>
                <div className='flex-1 p-4 min-w-0'>
                    <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
                        <div className='min-w-0'>
                            <h3 className='font-semibold text-lg truncate'>{item.name}</h3>
                            <p className='text-sm text-muted-foreground'>Продавец: {item.seller}</p>
                            {item.optionSelections && item.optionSelections.length > 0 && (
                                <div className='mt-2 flex flex-wrap gap-1.5'>
                                    {item.optionSelections.map((opt) => (
                                        <Badge
                                            key={opt.valueId}
                                            variant='secondary'
                                            className='font-normal bg-lavender-dessert/40 text-secondary hover:bg-lavender-dessert/50'
                                        >
                                            <span className='text-muted-foreground mr-1'>{opt.groupName}:</span>
                                            {opt.label}
                                            {opt.priceDelta !== 0 && (
                                                <span className='ml-1 text-muted-foreground'>
                                                    {opt.priceDelta > 0 ? '+' : ''}
                                                    {opt.priceDelta.toFixed(0)}₽
                                                </span>
                                            )}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {item.customerNote && (
                                <p className='mt-1 text-xs text-muted-foreground italic line-clamp-2'>
                                    «{item.customerNote}»
                                </p>
                            )}
                        </div>
                        <div className='text-lg font-semibold whitespace-nowrap'>
                            {(item.price * item.quantity).toFixed(2)} руб.
                        </div>
                    </div>
                    <div className='flex flex-wrap justify-between items-center gap-2 mt-4'>
                        <div className='flex items-center'>
                            <Button
                                variant='outline'
                                size='icon'
                                className='h-8 w-8 rounded-full'
                                onClick={() => updateQuantity(lineId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                            >
                                <Minus className='h-3 w-3'/>
                                <span className='sr-only'>Уменьшить количество</span>
                            </Button>
                            <span className='w-12 text-center'>{item.quantity}</span>
                            <Button
                                variant='outline'
                                size='icon'
                                className='h-8 w-8 rounded-full'
                                onClick={() => updateQuantity(lineId, item.quantity + 1)}
                            >
                                <Plus className='h-3 w-3'/>
                                <span className='sr-only'>Увеличить количество</span>
                            </Button>
                        </div>
                        <div className='flex items-center gap-1'>
                            <Button variant='ghost' size='sm' onClick={() => setEditing((v) => !v)}>
                                <Pencil className='h-4 w-4 mr-1'/>
                                {editing ? 'Скрыть' : 'Изменить'}
                            </Button>
                            <Button
                                variant='ghost'
                                size='sm'
                                className='text-destructive'
                                onClick={() => removeItem(lineId)}
                            >
                                <Trash2 className='h-4 w-4 mr-1'/>
                                Удалить
                            </Button>
                        </div>
                    </div>

                    {editing && (
                        <CartItemEditor
                            item={item}
                            lineId={lineId}
                            onClose={() => setEditing(false)}
                        />
                    )}
                </div>
            </div>
        </Card>
    )
}

interface EditorProps {
    item: CartItem
    lineId: string
    onClose: () => void
}

function CartItemEditor({item, lineId, onClose}: EditorProps) {
    const productId = item.productId as unknown as number
    const {groups, loading, error} = useProductOptions(productId)
    const {addItem, removeItem} = useCartActions()

    const [selections, setSelections] = useState<Record<number, number>>(() => {
        const seed: Record<number, number> = {}
        for (const opt of item.optionSelections ?? []) seed[opt.groupId] = opt.valueId
        return seed
    })
    const [note, setNote] = useState(item.customerNote ?? '')

    const currentDelta = useMemo(
        () => (item.optionSelections ?? []).reduce((sum, opt) => sum + opt.priceDelta, 0),
        [item.optionSelections],
    )
    const basePrice = item.price - currentDelta

    const newDelta = useMemo(() => {
        let sum = 0
        for (const g of groups) {
            const vid = selections[g.id]
            if (vid === undefined) continue
            const v = g.values.find((vv) => vv.id === vid)
            if (v) sum += v.priceDelta
        }
        return sum
    }, [groups, selections])

    const newUnitPrice = basePrice + newDelta

    const save = () => {
        const nextSelections: CartItemOptionSelection[] = groups
            .map((g) => {
                const vid = selections[g.id]
                if (vid === undefined) return null
                const v = g.values.find((vv) => vv.id === vid)
                if (!v) return null
                return {
                    groupId: g.id,
                    groupName: g.name,
                    valueId: v.id,
                    label: v.label,
                    priceDelta: v.priceDelta,
                }
            })
            .filter((x): x is CartItemOptionSelection => x !== null)

        removeItem(lineId)
        addItem(
            {
                productId: item.productId,
                name: item.name,
                price: newUnitPrice,
                image: item.image,
                seller: item.seller,
                optionSelections: nextSelections.length > 0 ? nextSelections : undefined,
                customerNote: note.trim() || undefined,
            },
            item.quantity,
        )
        onClose()
    }

    return (
        <div className='mt-4 rounded-lg border border-lavender-dessert/40 bg-lavender-dessert/10 p-3 space-y-3'>
            {loading && <p className='text-xs text-muted-foreground'>Загружаем параметры…</p>}
            {error && <p className='text-xs text-destructive'>Не удалось загрузить параметры: {error}</p>}
            {!loading && groups.length === 0 && !error && (
                <p className='text-xs text-muted-foreground'>У этого товара нет настраиваемых параметров.</p>
            )}

            {groups.map((g) => (
                <div key={g.id} className='flex flex-col gap-1'>
                    <label className='text-xs font-medium text-secondary'>
                        {g.name}
                        {g.required && <span className='text-primary ml-0.5'>*</span>}
                    </label>
                    <Select
                        value={selections[g.id]?.toString() ?? ''}
                        onValueChange={(v) =>
                            setSelections((prev) => ({...prev, [g.id]: Number(v)}))
                        }
                    >
                        <SelectTrigger className='h-9'>
                            <SelectValue placeholder='Выберите значение'/>
                        </SelectTrigger>
                        <SelectContent>
                            {g.values.map((v) => (
                                <SelectItem key={v.id} value={v.id.toString()}>
                                    {v.label}
                                    {v.priceDelta !== 0 && (
                                        <span className='ml-2 text-muted-foreground'>
                                            {v.priceDelta > 0 ? '+' : ''}
                                            {v.priceDelta.toFixed(0)}₽
                                        </span>
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ))}

            <div className='flex flex-col gap-1'>
                <label className='text-xs font-medium text-secondary'>Комментарий</label>
                <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder='Пожелания к оформлению'
                    className='min-h-[60px]'
                />
            </div>

            <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span>
                    Цена за единицу: <strong className='text-foreground'>{newUnitPrice.toFixed(2)} ₽</strong>
                </span>
                {newDelta !== currentDelta && (
                    <span>
                        Изменение: {newDelta - currentDelta > 0 ? '+' : ''}
                        {(newDelta - currentDelta).toFixed(2)} ₽ / шт
                    </span>
                )}
            </div>

            <div className='flex justify-end gap-2'>
                <Button size='sm' variant='outline' onClick={onClose}>
                    Отмена
                </Button>
                <Button size='sm' onClick={save} disabled={loading}>
                    Сохранить
                </Button>
            </div>
        </div>
    )
}
