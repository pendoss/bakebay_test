'use client'

import Image from 'next/image'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Loader2, MessageSquarePlus, Minus, Pencil, Plus, Trash2, X} from 'lucide-react'
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

const COMMIT_DELAY_MS = 350

export function CartItemRow({item}: Props) {
    const lineId = cartLineId(item)
    const {updateQuantity, removeItem, addItem} = useCartActions()
    const productId = item.productId as unknown as number
    const {groups, loading, error} = useProductOptions(productId)

    // Локальные «draft» выборы — сразу обновляются при клике, чтобы UI
    // не мерцал в ожидании коммита в стор.
    const [draftSelections, setDraftSelections] = useState<CartItemOptionSelection[]>(
        () => item.optionSelections ?? [],
    )
    const [pending, setPending] = useState(false)
    const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        // Когда строка пересоздаётся после коммита, подтягиваем новое item.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync local draft with store
        setDraftSelections(item.optionSelections ?? [])
    }, [item.optionSelections])

    useEffect(() => {
        return () => {
            if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
        }
    }, [])

    const basePrice = useMemo(() => {
        const currentDelta = (item.optionSelections ?? []).reduce((s, o) => s + o.priceDelta, 0)
        return item.price - currentDelta
    }, [item.optionSelections, item.price])

    const draftDelta = useMemo(
        () => draftSelections.reduce((s, o) => s + o.priceDelta, 0),
        [draftSelections],
    )
    const draftUnitPrice = basePrice + draftDelta

    const commit = useCallback(
        (selections: CartItemOptionSelection[], nextNote: string) => {
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
        },
        [addItem, basePrice, item.image, item.name, item.productId, item.quantity, item.seller, lineId, removeItem],
    )

    const scheduleCommit = useCallback(
        (selections: CartItemOptionSelection[], nextNote: string) => {
            if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
            setPending(true)
            commitTimerRef.current = setTimeout(() => {
                commit(selections, nextNote)
                // pending сбросится при remount — не трогаем setPending, потому
                // что компонент может размонтироваться к этому моменту.
            }, COMMIT_DELAY_MS)
        },
        [commit],
    )

    const toggleOption = (group: ProductOptionGroupDTO, value: ProductOptionValueDTO) => {
        const isActive = draftSelections.some((o) => o.groupId === group.id && o.valueId === value.id)

        let next: CartItemOptionSelection[]
        if (isActive) {
            if (group.required) return
            next = draftSelections.filter((o) => o.groupId !== group.id)
        } else {
            next = [
                ...draftSelections.filter((o) => o.groupId !== group.id),
                {
                    groupId: group.id,
                    groupName: group.name,
                    valueId: value.id,
                    label: value.label,
                    priceDelta: value.priceDelta,
                },
            ]
        }
        setDraftSelections(next)
        scheduleCommit(next, item.customerNote ?? '')
    }

    const commitNoteNow = (nextNote: string) => {
        if ((item.customerNote ?? '') === nextNote.trim()) return
        if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
        setPending(true)
        commit(draftSelections, nextNote)
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
                        <div className='text-lg font-semibold whitespace-nowrap flex items-center gap-2'>
                            {pending && (
                                <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' aria-label='Обновляем'/>
                            )}
                            {(draftUnitPrice * item.quantity).toFixed(2)} руб.
                        </div>
                    </div>

                    {groups.length > 0 && (
                        <div className='space-y-2'>
                            {groups.map((g) => (
                                <OptionChipRow
                                    key={g.id}
                                    group={g}
                                    selectedValueId={draftSelections.find((o) => o.groupId === g.id)?.valueId}
                                    onSelect={(v) => toggleOption(g, v)}
                                />
                            ))}
                        </div>
                    )}

                    {loading && groups.length === 0 && (
                        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                            <Loader2 className='h-3.5 w-3.5 animate-spin'/>
                            Загружаем параметры…
                        </div>
                    )}
                    {error && (
                        <p className='text-xs text-destructive'>Не удалось загрузить параметры.</p>
                    )}

                    <NoteField
                        initialNote={item.customerNote ?? ''}
                        onCommit={(next) => commitNoteNow(next)}
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
    const hasNote = initialNote.trim().length > 0
    const [editing, setEditing] = useState(false)
    // Локальный буфер, пока поле открыто; коммит в стор — по blur
    // или по кнопке «Сохранить», чтобы lineId не пересчитывался посимвольно.
    const [value, setValue] = useState(initialNote)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync buffer with store when not editing
        if (!editing) setValue(initialNote)
    }, [initialNote, editing])

    if (editing) {
        const commit = () => {
            onCommit(value)
            setEditing(false)
        }
        return (
            <div>
                <div className='flex items-center justify-between mb-1'>
                    <label className='text-xs font-medium text-secondary'>Комментарий продавцу</label>
                    <button
                        type='button'
                        onClick={() => {
                            setValue(initialNote)
                            setEditing(false)
                        }}
                        className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
                    >
                        <X className='h-3 w-3'/>
                        Отмена
                    </button>
                </div>
                <Textarea
                    value={value}
                    autoFocus
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault()
                            commit()
                        }
                        if (e.key === 'Escape') {
                            e.preventDefault()
                            setValue(initialNote)
                            setEditing(false)
                        }
                    }}
                    placeholder='Пожелания к оформлению, аллергии, дата получения…'
                    rows={2}
                    className='min-h-[52px] text-sm'
                />
                <p className='mt-1 text-[11px] text-muted-foreground'>
                    Сохранится автоматически, когда уйдёшь из поля
                </p>
            </div>
        )
    }

    if (!hasNote) {
        return (
            <button
                type='button'
                onClick={() => setEditing(true)}
                className='inline-flex items-center gap-1.5 text-xs text-primary hover:underline'
            >
                <MessageSquarePlus className='h-3.5 w-3.5'/>
                Добавить пожелание продавцу
            </button>
        )
    }

    return (
        <div className='rounded-md border border-lavender-dessert/40 bg-lavender-dessert/10 px-3 py-2'>
            <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0'>
                    <p className='text-[11px] uppercase tracking-wider text-muted-foreground'>Комментарий продавцу</p>
                    <p className='mt-0.5 text-sm text-foreground italic whitespace-pre-wrap break-words'>
                        «{initialNote}»
                    </p>
                </div>
                <button
                    type='button'
                    onClick={() => setEditing(true)}
                    className='shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
                >
                    <Pencil className='h-3 w-3'/>
                    Изменить
                </button>
            </div>
        </div>
    )
}
