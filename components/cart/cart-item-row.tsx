'use client'

import Image from 'next/image'
import {useEffect, useMemo, useState} from 'react'
import {Minus, Plus, Trash2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Textarea} from '@/components/ui/textarea'
import {
    cartLineId,
    type CartItem,
    type CartItemOptionSelection,
} from '@/src/domain/cart'
import {useCartActions} from '@/src/adapters/ui/react/stores'
import {
    useProductOptions,
    type ProductOptionGroupDTO,
    type ProductOptionValueDTO,
} from '@/src/adapters/ui/react/hooks/use-product-options'

interface Props {
    item: CartItem
}

export function CartItemRow({item}: Props) {
    const lineId = cartLineId(item)
    const {updateQuantity, removeItem, addItem} = useCartActions()
    const productId = item.productId as unknown as number
    const {groups, loading, error} = useProductOptions(productId)

    const currentDelta = useMemo(
        () => (item.optionSelections ?? []).reduce((s, o) => s + o.priceDelta, 0),
        [item.optionSelections],
    )
    const basePrice = item.price - currentDelta

    const replaceLine = (selections: CartItemOptionSelection[], nextNote: string) => {
        const newUnitPrice = basePrice + selections.reduce((s, o) => s + o.priceDelta, 0)
        removeItem(lineId)
        addItem(
            {
                productId: item.productId,
                name: item.name,
                price: newUnitPrice,
                image: item.image,
                seller: item.seller,
                optionSelections: selections.length > 0 ? selections : undefined,
                customerNote: nextNote.trim() || undefined,
            },
            item.quantity,
        )
    }

    const toggleOption = (group: ProductOptionGroupDTO, value: ProductOptionValueDTO) => {
        const current = item.optionSelections ?? []
        const isActive = current.some((o) => o.groupId === group.id && o.valueId === value.id)

        let next: CartItemOptionSelection[]
        if (isActive) {
            // Required-группу нельзя оставить без значения; необязательную — можно снять.
            if (group.required) return
            next = current.filter((o) => o.groupId !== group.id)
        } else {
            next = [
                ...current.filter((o) => o.groupId !== group.id),
                {
                    groupId: group.id,
                    groupName: group.name,
                    valueId: value.id,
                    label: value.label,
                    priceDelta: value.priceDelta,
                },
            ]
        }
        replaceLine(next, item.customerNote ?? '')
    }

    return (
        <Card className='overflow-hidden'>
            <div className='flex flex-col sm:flex-row'>
                <div className='w-full sm:w-32 h-32 relative shrink-0'>
                    <Image src={item.image || '/placeholder.svg'} alt={item.name} fill className='object-cover'/>
                </div>

                <div className='flex-1 p-4 min-w-0 space-y-3'>
                    <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
                        <div className='min-w-0'>
                            <h3 className='font-semibold text-lg truncate'>{item.name}</h3>
                            <p className='text-sm text-muted-foreground'>Продавец: {item.seller}</p>
                        </div>
                        <div className='text-lg font-semibold whitespace-nowrap'>
                            {(item.price * item.quantity).toFixed(2)} руб.
                        </div>
                    </div>

                    {groups.length > 0 && (
                        <div className='space-y-2'>
                            {groups.map((g) => (
                                <OptionChipRow
                                    key={g.id}
                                    group={g}
                                    selectedValueId={item.optionSelections?.find((o) => o.groupId === g.id)?.valueId}
                                    onSelect={(v) => toggleOption(g, v)}
                                />
                            ))}
                        </div>
                    )}

                    {loading && groups.length === 0 && (
                        <p className='text-xs text-muted-foreground'>Загружаем параметры…</p>
                    )}
                    {error && (
                        <p className='text-xs text-destructive'>Не удалось загрузить параметры.</p>
                    )}

                    <NoteField
                        initialNote={item.customerNote ?? ''}
                        onCommit={(next) => {
                            if ((item.customerNote ?? '') === next.trim()) return
                            replaceLine(item.optionSelections ?? [], next)
                        }}
                    />

                    <div className='flex flex-wrap justify-between items-center gap-2 pt-1'>
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
            </div>
        </Card>
    )
}

interface OptionChipRowProps {
    group: ProductOptionGroupDTO
    selectedValueId: number | undefined
    onSelect: (value: ProductOptionValueDTO) => void
}

function OptionChipRow({group, selectedValueId, onSelect}: OptionChipRowProps) {
    return (
        <div>
            <div className='flex items-baseline gap-2 mb-1'>
                <span className='text-xs font-medium text-secondary'>{group.name}</span>
                {group.required && (
                    <span className='text-[10px] uppercase tracking-wider text-primary'>обязательно</span>
                )}
            </div>
            <div className='flex flex-wrap gap-1.5'>
                {group.values.map((v) => {
                    const active = selectedValueId === v.id
                    return (
                        <button
                            key={v.id}
                            type='button'
                            onClick={() => onSelect(v)}
                            className={[
                                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition',
                                active
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                    : 'bg-white border-lavender-dessert/60 text-secondary hover:border-primary/40 hover:bg-lavender-dessert/20',
                            ].join(' ')}
                        >
                            <span>{v.label}</span>
                            {v.priceDelta !== 0 && (
                                <span className={active ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                                    {v.priceDelta > 0 ? '+' : ''}
                                    {v.priceDelta.toFixed(0)}₽
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

interface NoteFieldProps {
    initialNote: string
    onCommit: (next: string) => void
}

function NoteField({initialNote, onCommit}: NoteFieldProps) {
    // Локальный буфер — обновляется на каждый ввод, коммитится в стор
    // только на blur, чтобы lineId не пересчитывался посимвольно.
    const [value, setValue] = useState(initialNote)

    useEffect(() => {
        setValue(initialNote)
    }, [initialNote])

    return (
        <div>
            <label className='text-xs font-medium text-secondary'>Комментарий продавцу</label>
            <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => onCommit(value)}
                placeholder='Пожелания к оформлению, аллергии, дата получения…'
                rows={2}
                className='mt-1 min-h-[52px] text-sm'
            />
        </div>
    )
}
