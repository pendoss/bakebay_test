'use client'

import Image from 'next/image'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Loader2, MessageSquarePlus, Minus, Plus, Trash2, X} from 'lucide-react'
import {Textarea} from '@/components/ui/textarea'
import {type CartItem, type CartItemOptionSelection} from '@/src/domain/cart'
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

const fmt = (n: number) =>
    n.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2})

export function CartItemRow({item}: Props) {
    const {updateQuantity, removeItem, updateItem} = useCartActions()
    const productId = item.productId as unknown as number
    const {groups, loading, error} = useProductOptions(productId)

    const [draftSelections, setDraftSelections] = useState<CartItemOptionSelection[]>(
        () => item.optionSelections ?? [],
    )
    const [pending, setPending] = useState(false)
    const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const itemOptionsKey = (item.optionSelections ?? [])
        .map((o) => `${o.groupId}:${o.valueId}`)
        .sort()
        .join('|')
    const draftKey = draftSelections
        .map((o) => `${o.groupId}:${o.valueId}`)
        .sort()
        .join('|')

    useEffect(() => {
        if (itemOptionsKey === draftKey) return
        // eslint-disable-next-line react-hooks/set-state-in-effect -- external sync
        setDraftSelections(item.optionSelections ?? [])
    }, [itemOptionsKey, draftKey, item.optionSelections])

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
    const draftTotal = draftUnitPrice * item.quantity

    const commit = useCallback(
        (selections: CartItemOptionSelection[], nextNote: string) => {
            const newUnitPrice = basePrice + selections.reduce((s, o) => s + o.priceDelta, 0)
            updateItem(item.clientId, {
                price: newUnitPrice,
                optionSelections: selections.length > 0 ? selections : undefined,
                customerNote: nextNote.trim() || undefined,
            })
            setPending(false)
        },
        [basePrice, item.clientId, updateItem],
    )

    const scheduleCommit = useCallback(
        (selections: CartItemOptionSelection[], nextNote: string) => {
            if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
            setPending(true)
            commitTimerRef.current = setTimeout(() => commit(selections, nextNote), COMMIT_DELAY_MS)
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
        <article className='grid grid-cols-1 md:grid-cols-[260px_1fr] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_30px_-18px_rgba(33,40,54,0.18),0_1px_0_rgba(15,22,36,0.02)]'>
            {/* hero */}
            <div className='relative min-h-[180px] md:min-h-full bg-gradient-to-b from-lavender-dessert/30 to-lavender-dessert/10'>
                <div className='absolute inset-3 overflow-hidden rounded-xl bg-muted/40'>
                    {item.image ? (
                        <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className='object-cover'
                            sizes='(max-width: 768px) 100vw, 260px'
                        />
                    ) : (
                        <div className='h-full w-full flex items-center justify-center text-muted-foreground text-xs'>
                            Нет фото
                        </div>
                    )}
                </div>
            </div>

            {/* body */}
            <div className='p-6 flex flex-col gap-4 min-w-0'>
                <header className='flex items-start justify-between gap-4'>
                    <div className='min-w-0'>
                        <h3 className='text-lg font-semibold leading-tight tracking-tight truncate'>
                            {item.name}
                        </h3>
                        <p className='mt-1 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground'>
                            <span className='h-1.5 w-1.5 rounded-full bg-primary'/>
                            Продавец:{' '}
                            <span className='text-foreground font-medium whitespace-nowrap'>{item.seller}</span>
                        </p>
                    </div>
                    <div className='text-right shrink-0'>
                        <div className='text-xl font-semibold tracking-tight tabular-nums leading-none flex items-center justify-end gap-2'>
                            {pending && (
                                <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' aria-label='Обновляем'/>
                            )}
                            {fmt(draftUnitPrice)}
                            <span className='text-sm text-muted-foreground font-normal'>₽</span>
                        </div>
                        <div className='mt-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground'>
                            за штуку
                        </div>
                    </div>
                </header>

                {groups.length > 0 && (
                    <div className='flex flex-col gap-3'>
                        {groups.map((g) => (
                            <OptionSection
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
                {error && <p className='text-xs text-destructive'>Не удалось загрузить параметры.</p>}

                <NoteField
                    initialNote={item.customerNote ?? ''}
                    onCommit={(next) => commitNoteNow(next)}
                />

                <footer className='mt-1 border-t border-border/60 pt-4 grid grid-cols-[auto_1fr_auto] items-center gap-4 max-md:grid-cols-1 max-md:items-stretch'>
                    {/* qty pill */}
                    <div
                        role='group'
                        aria-label='Количество'
                        className='inline-flex items-center rounded-full border border-border bg-muted/30 p-1 self-start'
                    >
                        <button
                            type='button'
                            onClick={() => updateQuantity(item.clientId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label='Уменьшить'
                            className='h-8 w-8 flex items-center justify-center rounded-full bg-white text-foreground shadow-sm transition active:scale-90 hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:hover:bg-white'
                        >
                            <Minus className='h-3.5 w-3.5'/>
                        </button>
                        <div className='min-w-[40px] text-center font-semibold tabular-nums text-[15px]'>
                            {item.quantity}
                        </div>
                        <button
                            type='button'
                            onClick={() => updateQuantity(item.clientId, item.quantity + 1)}
                            aria-label='Увеличить'
                            className='h-8 w-8 flex items-center justify-center rounded-full bg-white text-foreground shadow-sm transition active:scale-90 hover:bg-primary/10 hover:text-primary'
                        >
                            <Plus className='h-3.5 w-3.5'/>
                        </button>
                    </div>

                    {/* breakdown */}
                    <Breakdown
                        basePrice={basePrice}
                        selections={draftSelections}
                        quantity={item.quantity}
                        total={draftTotal}
                    />

                    <button
                        type='button'
                        onClick={() => removeItem(item.clientId)}
                        className='inline-flex items-center gap-2 self-center rounded-lg px-3 py-2 text-[13px] font-semibold text-primary transition hover:bg-primary/10 justify-self-end max-md:justify-self-start'
                    >
                        <Trash2 className='h-4 w-4'/>
                        Удалить
                    </button>
                </footer>
            </div>
        </article>
    )
}

interface OptionSectionProps {
    group: ProductOptionGroupDTO
    selectedValueId: number | undefined
    onSelect: (value: ProductOptionValueDTO) => void
}

function OptionSection({group, selectedValueId, onSelect}: OptionSectionProps) {
    return (
        <div className='flex flex-col gap-1.5'>
            <div className='flex items-center gap-2 text-[13px] font-semibold text-foreground'>
                <span>{group.name}</span>
                {group.required && (
                    <span className='inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.04em] font-bold text-primary'>
                        <span className='h-1 w-1 rounded-full bg-primary ring-2 ring-primary/15'/>
                        обязательно
                    </span>
                )}
            </div>
            <Segmented group={group} selectedValueId={selectedValueId} onSelect={onSelect}/>
        </div>
    )
}

function Segmented({group, selectedValueId, onSelect}: OptionSectionProps) {
    return (
        <div
            role='radiogroup'
            className='inline-flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1'
        >
            {group.values.map((v) => {
                const active = selectedValueId === v.id
                return (
                    <button
                        key={v.id}
                        type='button'
                        role='radio'
                        aria-checked={active}
                        onClick={() => onSelect(v)}
                        className={[
                            'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition',
                            active
                                ? 'bg-primary text-primary-foreground shadow-[0_2px_6px_rgba(224,102,128,0.35)]'
                                : 'text-foreground/80 hover:text-foreground hover:bg-white/70',
                        ].join(' ')}
                    >
                        <span>{v.label}</span>
                        {v.priceDelta !== 0 && (
                            <span
                                className={[
                                    'text-[11px] tabular-nums font-medium',
                                    active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                                ].join(' ')}
                            >
                                {v.priceDelta > 0 ? '+' : ''}
                                {v.priceDelta.toLocaleString('ru-RU')} ₽
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}

interface BreakdownProps {
    basePrice: number
    selections: CartItemOptionSelection[]
    quantity: number
    total: number
}

function Breakdown({basePrice, selections, quantity, total}: BreakdownProps) {
    const nonZero = selections.filter((s) => s.priceDelta !== 0)
    return (
        <div className='flex flex-col items-end gap-1 min-w-0 max-md:items-start'>
            <div className='flex flex-wrap justify-end gap-x-3 gap-y-1 tabular-nums max-md:justify-start'>
                <BreakdownRow label='Базовая' value={`${basePrice.toLocaleString('ru-RU')} ₽`}/>
                {nonZero.map((s) => (
                    <BreakdownRow
                        key={`${s.groupId}-${s.valueId}`}
                        label={s.groupName}
                        value={`${s.priceDelta > 0 ? '+' : ''}${s.priceDelta.toLocaleString('ru-RU')} ₽`}
                    />
                ))}
                {quantity > 1 && <BreakdownRow label={`× ${quantity}`} value=''/>}
            </div>
            <div className='mt-1 flex items-baseline gap-2'>
                <span className='text-[10px] uppercase tracking-[0.08em] text-muted-foreground'>Итого</span>
                <span className='text-xl font-semibold tracking-tight text-foreground tabular-nums'>
                    {fmt(total)}
                    <span className='ml-1 text-sm font-normal text-muted-foreground'>руб.</span>
                </span>
            </div>
        </div>
    )
}

function BreakdownRow({label, value}: {label: string; value: string}) {
    return (
        <span className='inline-flex items-baseline gap-1.5 text-[11px] text-muted-foreground'>
            <span>{label}</span>
            {value && <span className='text-foreground/80'>{value}</span>}
        </span>
    )
}

interface NoteFieldProps {
    initialNote: string
    onCommit: (next: string) => void
}

const NOTE_MAX = 220

function NoteField({initialNote, onCommit}: NoteFieldProps) {
    const hasNote = initialNote.trim().length > 0
    const [editing, setEditing] = useState(false)
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
            <div className='rounded-xl bg-primary/10 p-3.5 flex flex-col gap-2'>
                <div className='flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.02em] text-primary'>
                    <MessageSquarePlus className='h-3.5 w-3.5'/>
                    Пожелание продавцу
                    <button
                        type='button'
                        onClick={() => {
                            setValue(initialNote)
                            setEditing(false)
                        }}
                        className='ml-auto inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition'
                        aria-label='Закрыть'
                    >
                        <X className='h-3.5 w-3.5'/>
                    </button>
                </div>
                <Textarea
                    autoFocus
                    value={value}
                    maxLength={NOTE_MAX}
                    onChange={(e) => setValue(e.target.value.slice(0, NOTE_MAX))}
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
                    placeholder='Например: надпись «С днём рождения, Аня», без орехов'
                    rows={2}
                    className='min-h-[54px] resize-y rounded-md border-primary/30 bg-white text-sm focus-visible:ring-primary focus-visible:border-primary'
                />
                <div className='text-right text-[11px] tabular-nums text-primary/80'>
                    {value.length}/{NOTE_MAX}
                </div>
            </div>
        )
    }

    if (!hasNote) {
        return (
            <button
                type='button'
                onClick={() => setEditing(true)}
                className='inline-flex items-center gap-2 self-start text-[13px] font-semibold text-primary transition hover:text-primary/80'
            >
                <MessageSquarePlus className='h-4 w-4'/>
                Добавить пожелание продавцу
            </button>
        )
    }

    return (
        <div className='rounded-xl bg-primary/10 px-4 py-3'>
            <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0'>
                    <p className='text-[11px] font-bold uppercase tracking-[0.02em] text-primary'>
                        Пожелание продавцу
                    </p>
                    <p className='mt-1 text-sm text-foreground italic whitespace-pre-wrap break-words'>
                        «{initialNote}»
                    </p>
                </div>
                <button
                    type='button'
                    onClick={() => setEditing(true)}
                    className='shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-primary hover:bg-primary/15 transition'
                >
                    Изменить
                </button>
            </div>
        </div>
    )
}
