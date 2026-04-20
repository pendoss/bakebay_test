'use client'

import {useMemo, useRef, useState} from 'react'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {Separator} from '@/components/ui/separator'
import {Paperclip, X, XCircle} from 'lucide-react'
import {
    useCustomizationThread,
    type MessageDTO,
    type OfferDTO,
} from '@/src/adapters/ui/react/hooks/use-customization-thread'
import {cancelSellerOrder} from '@/src/adapters/ui/react/hooks/use-customer-orders'
import {
    useSellerOrderItemContext,
    type ClientSelectionDTO,
    type LibraryIngredientDTO,
} from '@/src/adapters/ui/react/hooks/use-seller-order-item-context'
import {StockReportPanel} from '@/components/stock-report-panel'

interface CustomizationChatProps {
    threadId: number
    viewerRole: 'customer' | 'seller'
    sellerOrderId?: number
    onAfterCancel?: () => void
}

const THREAD_STATUS_LABEL: Record<string, string> = {
    open: 'Обсуждаем',
    awaiting_seller_finalize: 'Клиент подтвердил',
    agreed: 'Согласовано',
    rejected: 'Отклонено',
}

export function CustomizationChat({threadId, viewerRole, sellerOrderId, onAfterCancel}: CustomizationChatProps) {
    const {
        thread,
        loading,
        error,
        postMessage,
        submitOffer,
        acceptOffer,
        requestRevision,
        finalizeAgreement,
    } = useCustomizationThread(threadId)
    const [draft, setDraft] = useState('')
    const [busy, setBusy] = useState(false)
    const [pendingFiles, setPendingFiles] = useState<File[]>([])
    const [cancelReason, setCancelReason] = useState('')
    const [showCancel, setShowCancel] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const {ctx} = useSellerOrderItemContext(thread?.sellerOrderItemId ?? null)

    const latestActiveOffer = useMemo<OfferDTO | null>(() => {
        if (!thread) return null
        const active = thread.offers.filter((o) => o.supersededByOfferId === null)
        if (active.length === 0) return null
        return active.reduce((a, b) => (a.version >= b.version ? a : b))
    }, [thread])

    if (!threadId) return null
    if (loading && !thread) return <div className='p-4 text-sm text-muted-foreground'>Загрузка чата…</div>
    if (error) return <div className='p-4 text-sm text-red-500'>Ошибка: {error}</div>
    if (!thread) return null

    const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const list = e.target.files
        if (!list) return
        setPendingFiles((prev) => [...prev, ...Array.from(list)])
        e.target.value = ''
    }

    const removePendingFile = (index: number) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const handlePost = async () => {
        if (!draft.trim() && pendingFiles.length === 0) return
        setBusy(true)
        try {
            await postMessage(draft.trim(), pendingFiles)
            setDraft('')
            setPendingFiles([])
        } finally {
            setBusy(false)
        }
    }

    const handleOffer = async (payload: Parameters<typeof submitOffer>[0]) => {
        setBusy(true)
        try {
            await submitOffer(payload)
        } finally {
            setBusy(false)
        }
    }

    const handleAccept = async (offerId: number) => {
        setBusy(true)
        try {
            await acceptOffer(offerId)
        } finally {
            setBusy(false)
        }
    }

    const handleRevision = async () => {
        setBusy(true)
        try {
            await requestRevision(draft.trim() || undefined)
            setDraft('')
        } finally {
            setBusy(false)
        }
    }

    const handleCancel = async () => {
        if (!sellerOrderId || !cancelReason.trim()) return
        setBusy(true)
        try {
            await cancelSellerOrder(sellerOrderId, cancelReason.trim())
            setShowCancel(false)
            setCancelReason('')
            onAfterCancel?.()
        } finally {
            setBusy(false)
        }
    }

    return (
        <Card className='border-lavender-dessert/30'>
            <CardHeader className='flex-row items-center justify-between p-4'>
                <h4 className='font-semibold'>Согласование · подзаказ #{thread.sellerOrderItemId}</h4>
                <Badge variant='outline'>{THREAD_STATUS_LABEL[thread.status] ?? thread.status}</Badge>
            </CardHeader>
            <CardContent className='space-y-4 p-4 pt-0'>
                {ctx && (ctx.optionSelections.length > 0 || ctx.recipeIngredients.some((i) => i.isOptional)) && (
                    <div className='rounded-lg border border-lavender-dessert/40 bg-lavender-dessert/10 p-3 space-y-2'>
                        <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                            Запрос клиента
                        </div>
                        <div className='text-sm font-medium'>
                            {ctx.item.quantity} × {ctx.item.productName}
                        </div>
                        {ctx.optionSelections.length > 0 && (
                            <div className='flex flex-wrap gap-1.5'>
                                {ctx.optionSelections.map((s) => (
                                    <span
                                        key={s.valueId}
                                        className='inline-flex items-center gap-1 rounded-full border border-foreground/20 bg-background px-2 py-0.5 text-xs'
                                    >
                                        <span className='text-muted-foreground'>{s.groupName}:</span>
                                        <span className='font-medium'>{s.label}</span>
                                        {s.priceDelta !== 0 && (
                                            <span className='text-muted-foreground'>
                                                {s.priceDelta > 0 ? '+' : ''}
                                                {s.priceDelta} ₽
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <div className='space-y-2 max-h-80 overflow-y-auto rounded border border-lavender-dessert/20 p-3'>
                    {thread.messages.length === 0 && (
                        <p className='text-sm text-muted-foreground'>Сообщений пока нет</p>
                    )}
                    {thread.messages.map((m) => (
                        <MessageBubble key={m.id} message={m} viewerRole={viewerRole}/>
                    ))}
                </div>

                <OffersList offers={thread.offers} activeId={latestActiveOffer?.id ?? null}/>

                {thread.status === 'awaiting_seller_finalize' && (
                    <div className='rounded-lg border border-mint-frosting/60 bg-mint-frosting/10 p-3 text-sm'>
                        <div className='font-medium mb-1'>
                            Клиент подтвердил оффер v{latestActiveOffer?.version ?? '?'}
                        </div>
                        <p className='text-muted-foreground'>
                            {viewerRole === 'seller'
                                ? 'Проверьте детали и финализируйте сделку — после этого позиция перейдёт в оплату. Обсуждение всё ещё открыто: можно отправить уточнение или новый оффер.'
                                : 'Вы подтвердили оффер. Ожидаем финализации от продавца. Пока можно писать — если передумали, отправьте уточнение.'}
                        </p>
                        {viewerRole === 'seller' && (
                            <Button
                                size='sm'
                                className='mt-2'
                                onClick={async () => {
                                    setBusy(true)
                                    try {
                                        await finalizeAgreement()
                                    } finally {
                                        setBusy(false)
                                    }
                                }}
                                disabled={busy}
                            >
                                Финализировать сделку
                            </Button>
                        )}
                    </div>
                )}

                {(thread.status === 'open' || thread.status === 'awaiting_seller_finalize') && (
                    <>
                        <Separator/>
                        <div className='space-y-2'>
                            <Textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder={
                                    viewerRole === 'customer'
                                        ? 'Опишите пожелание…'
                                        : 'Задайте вопрос клиенту…'
                                }
                            />

                            {pendingFiles.length > 0 && (
                                <div className='flex flex-wrap gap-2 rounded border border-dashed p-2'>
                                    {pendingFiles.map((f, i) => (
                                        <div key={`${f.name}-${i}`}
                                             className='flex items-center gap-2 rounded bg-muted px-2 py-1 text-xs'>
                                            <span className='max-w-[180px] truncate'>{f.name}</span>
                                            <button
                                                type='button'
                                                onClick={() => removePendingFile(i)}
                                                className='text-muted-foreground hover:text-foreground'
                                                aria-label='Убрать вложение'
                                            >
                                                <X className='h-3 w-3'/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className='flex flex-wrap gap-2 items-center'>
                                <input
                                    ref={fileInputRef}
                                    type='file'
                                    accept='image/*'
                                    multiple
                                    className='hidden'
                                    onChange={handleFilePick}
                                />
                                <Button
                                    type='button'
                                    size='sm'
                                    variant='outline'
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={busy}
                                >
                                    <Paperclip className='h-4 w-4 mr-1'/>
                                    Прикрепить
                                </Button>
                                <Button
                                    size='sm'
                                    onClick={handlePost}
                                    disabled={busy || (!draft.trim() && pendingFiles.length === 0)}
                                >
                                    Отправить
                                </Button>
                                {viewerRole === 'customer' && latestActiveOffer && thread.status === 'open' && (
                                    <Button
                                        size='sm'
                                        variant='default'
                                        onClick={() => handleAccept(latestActiveOffer.id)}
                                        disabled={busy}
                                    >
                                        Подтвердить оффер
                                    </Button>
                                )}
                                {viewerRole === 'customer' && latestActiveOffer && (
                                    <Button
                                        size='sm'
                                        variant='outline'
                                        onClick={handleRevision}
                                        disabled={busy}
                                    >
                                        Уточнить
                                    </Button>
                                )}
                                {sellerOrderId !== undefined && (
                                    <Button
                                        size='sm'
                                        variant='ghost'
                                        className='ml-auto text-destructive'
                                        onClick={() => setShowCancel((v) => !v)}
                                        disabled={busy}
                                    >
                                        <XCircle className='h-4 w-4 mr-1'/>
                                        Отменить позицию
                                    </Button>
                                )}
                            </div>

                            {showCancel && sellerOrderId !== undefined && (
                                <div className='rounded border border-destructive/40 p-3 space-y-2'>
                                    <p className='text-sm'>
                                        Отмена закроет этот подзаказ целиком. Опишите причину — она будет видна второй
                                        стороне.
                                    </p>
                                    <Textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder='Например: передумал, не получается согласовать…'
                                    />
                                    <div className='flex gap-2'>
                                        <Button
                                            size='sm'
                                            variant='destructive'
                                            onClick={handleCancel}
                                            disabled={busy || !cancelReason.trim()}
                                        >
                                            Подтвердить отмену
                                        </Button>
                                        <Button size='sm' variant='outline' onClick={() => setShowCancel(false)}>
                                            Назад
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {viewerRole === 'seller' && ctx?.viewerIsOwningSeller && (
                            <>
                                {sellerOrderId !== undefined && (
                                    <StockReportPanel sellerOrderId={sellerOrderId}/>
                                )}
                                <OfferComposer
                                    unitPrice={ctx.item.unitPrice}
                                    clientSelections={ctx.optionSelections}
                                    library={ctx.library}
                                    busy={busy}
                                    onSubmit={handleOffer}
                                />
                            </>
                        )}
                    </>
                )}

                {thread.status === 'agreed' && (
                    <p className='text-sm text-green-700'>Клиент подтвердил оффер. Позиция ждёт подтверждения и
                        оплаты.</p>
                )}
                {thread.status === 'rejected' && (
                    <p className='text-sm text-muted-foreground'>Согласование отклонено.</p>
                )}
            </CardContent>
        </Card>
    )
}

function MessageBubble({message, viewerRole}: { message: MessageDTO; viewerRole: 'customer' | 'seller' }) {
    const isOwn = message.author === viewerRole
    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                    isOwn ? 'bg-mint-frosting text-secondary' : 'bg-lavender-dessert/30'
                }`}
            >
                <div className='text-xs text-muted-foreground mb-1'>
                    {message.author === 'customer' ? 'Клиент' : 'Продавец'} ·{' '}
                    {new Date(message.createdAt).toLocaleTimeString('ru-RU')}
                </div>
                {message.body && <div className='whitespace-pre-wrap'>{message.body}</div>}
                {message.attachmentUrls.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-2'>
                        {message.attachmentUrls.map((url) => (
                            <a
                                key={url}
                                href={url}
                                target='_blank'
                                rel='noreferrer'
                                className='block overflow-hidden rounded border border-background/40'
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={url}
                                    alt='Вложение'
                                    className='h-32 w-32 object-cover'
                                    loading='lazy'
                                />
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

interface CustomIngredientDraft {
    key: string
    name: string
    unit: string
    amount: string
    priceDelta: string
    saveToLibrary: boolean
}

interface OfferComposerProps {
    unitPrice: number
    clientSelections: ClientSelectionDTO[]
    library: LibraryIngredientDTO[]
    busy: boolean
    onSubmit: (payload: {
        priceDelta: number
        sellerNotes: string
        optionSelections?: number[]
        customIngredients?: Array<{
            key: string
            name: string
            unit: string
            amount: number
            priceDelta: number
            saveToLibrary: boolean
        }>
    }) => Promise<void> | void
}

function OfferComposer({unitPrice, clientSelections, library, busy, onSubmit}: OfferComposerProps) {
    const [includeSelections, setIncludeSelections] = useState(true)
    const [customIngredients, setCustomIngredients] = useState<CustomIngredientDraft[]>([])
    const [librarySelection, setLibrarySelection] = useState<string>('')
    const [sellerNotes, setSellerNotes] = useState('')
    const [manualPriceDelta, setManualPriceDelta] = useState('0')

    const selectionsDelta = includeSelections
        ? clientSelections.reduce((sum, s) => sum + s.priceDelta, 0)
        : 0
    const customDelta = customIngredients.reduce((sum, it) => sum + (Number(it.priceDelta) || 0), 0)
    const manualExtra = Number(manualPriceDelta) || 0
    const totalDelta = selectionsDelta + customDelta + manualExtra
    const finalUnitPrice = unitPrice + totalDelta

    const addCustomFromLibrary = () => {
        const id = Number(librarySelection)
        if (!id) return
        const lib = library.find((l) => l.id === id)
        if (!lib) return
        setCustomIngredients((prev) => [
            ...prev,
            {
                key: `lib-${lib.id}-${Date.now()}`,
                name: lib.name,
                unit: lib.unit,
                amount: String(lib.defaultAmount),
                priceDelta: String(lib.priceDelta),
                saveToLibrary: false,
            },
        ])
        setLibrarySelection('')
    }

    const addCustomEmpty = () => {
        setCustomIngredients((prev) => [
            ...prev,
            {
                key: `new-${Date.now()}`,
                name: '',
                unit: 'г',
                amount: '',
                priceDelta: '0',
                saveToLibrary: false,
            },
        ])
    }

    const patchIngredient = (key: string, patch: Partial<CustomIngredientDraft>) => {
        setCustomIngredients((prev) => prev.map((it) => (it.key === key ? {...it, ...patch} : it)))
    }
    const removeIngredient = (key: string) => {
        setCustomIngredients((prev) => prev.filter((it) => it.key !== key))
    }

    const handleSubmit = async () => {
        await onSubmit({
            priceDelta: totalDelta,
            sellerNotes: sellerNotes.trim(),
            optionSelections: includeSelections ? clientSelections.map((s) => s.valueId) : [],
            customIngredients: customIngredients
                .filter((it) => it.name.trim().length > 0)
                .map((it) => ({
                    key: it.key,
                    name: it.name.trim(),
                    unit: it.unit.trim() || 'шт',
                    amount: Number(it.amount) || 0,
                    priceDelta: Number(it.priceDelta) || 0,
                    saveToLibrary: it.saveToLibrary,
                })),
        })
        setCustomIngredients([])
        setSellerNotes('')
        setManualPriceDelta('0')
    }

    return (
        <div className='space-y-3 rounded-lg border border-lavender-dessert/40 bg-background p-4'>
            <div className='flex items-baseline justify-between'>
                <h5 className='text-sm font-semibold'>Сформировать оффер</h5>
                <span className='text-xs text-muted-foreground'>Можно отправлять новый оффер в любой момент</span>
            </div>

            {clientSelections.length > 0 && (
                <label className='flex items-start gap-2 text-sm cursor-pointer'>
                    <input
                        type='checkbox'
                        checked={includeSelections}
                        onChange={(e) => setIncludeSelections(e.target.checked)}
                        className='mt-1'
                    />
                    <span>
                        Включить выбранные клиентом опции (
                        <span className='text-muted-foreground'>
                            {clientSelections.map((s) => s.label).join(', ')}
                        </span>
                        ) · {selectionsDelta > 0 ? '+' : ''}
                        {selectionsDelta} ₽
                    </span>
                </label>
            )}

            <div className='space-y-2'>
                <div className='flex items-center gap-2 flex-wrap'>
                    <span className='text-sm font-medium'>Кастом-ингредиенты</span>
                    {library.length > 0 && (
                        <>
                            <select
                                value={librarySelection}
                                onChange={(e) => setLibrarySelection(e.target.value)}
                                className='h-8 rounded border px-2 text-sm'
                            >
                                <option value=''>— из библиотеки —</option>
                                {library.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name} · +{l.priceDelta} ₽
                                    </option>
                                ))}
                            </select>
                            <Button
                                type='button'
                                size='sm'
                                variant='outline'
                                onClick={addCustomFromLibrary}
                                disabled={!librarySelection}
                            >
                                Добавить
                            </Button>
                        </>
                    )}
                    <Button type='button' size='sm' variant='ghost' onClick={addCustomEmpty}>
                        + свой
                    </Button>
                </div>

                {customIngredients.length === 0 ? (
                    <p className='text-xs text-muted-foreground'>
                        Добавьте ингредиент из библиотеки или новый — он войдёт в стоимость оффера.
                    </p>
                ) : (
                    <div className='space-y-2'>
                        {customIngredients.map((it) => (
                            <div key={it.key} className='rounded border border-muted p-2 space-y-1'>
                                <div className='flex flex-wrap items-center gap-2'>
                                    <input
                                        value={it.name}
                                        onChange={(e) => patchIngredient(it.key, {name: e.target.value})}
                                        placeholder='Название'
                                        className='h-8 min-w-[180px] flex-1 rounded border px-2 text-sm'
                                    />
                                    <input
                                        value={it.amount}
                                        onChange={(e) => patchIngredient(it.key, {amount: e.target.value})}
                                        placeholder='Кол-во'
                                        className='h-8 w-20 rounded border px-2 text-sm'
                                    />
                                    <input
                                        value={it.unit}
                                        onChange={(e) => patchIngredient(it.key, {unit: e.target.value})}
                                        placeholder='ед.'
                                        className='h-8 w-16 rounded border px-2 text-sm'
                                    />
                                    <input
                                        value={it.priceDelta}
                                        onChange={(e) => patchIngredient(it.key, {priceDelta: e.target.value})}
                                        placeholder='+₽'
                                        className='h-8 w-20 rounded border px-2 text-sm'
                                    />
                                    <Button
                                        type='button'
                                        size='sm'
                                        variant='ghost'
                                        onClick={() => removeIngredient(it.key)}
                                        aria-label='Удалить'
                                    >
                                        <X className='h-4 w-4'/>
                                    </Button>
                                </div>
                                <label className='flex items-center gap-2 text-xs text-muted-foreground cursor-pointer'>
                                    <input
                                        type='checkbox'
                                        checked={it.saveToLibrary}
                                        onChange={(e) =>
                                            patchIngredient(it.key, {saveToLibrary: e.target.checked})
                                        }
                                    />
                                    Сохранить в моей библиотеке для следующих заказов
                                </label>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className='flex flex-wrap items-center gap-2 text-sm'>
                <label className='text-muted-foreground'>Доплата вручную, ₽</label>
                <input
                    type='number'
                    value={manualPriceDelta}
                    onChange={(e) => setManualPriceDelta(e.target.value)}
                    className='h-8 w-24 rounded border px-2 text-sm'
                />
                <span className='text-xs text-muted-foreground'>
                    работа, срочность, декор — всё, чего нет в ингредиентах
                </span>
            </div>

            <Textarea
                value={sellerNotes}
                onChange={(e) => setSellerNotes(e.target.value)}
                placeholder='Заметки продавца: что именно согласовано (цвет, дата, упаковка)…'
            />

            <div className='flex flex-wrap items-center justify-between gap-3 rounded bg-muted/40 px-3 py-2 text-sm'>
                <div>
                    <div className='text-xs text-muted-foreground'>Итоговая цена позиции</div>
                    <div className='font-semibold'>
                        {finalUnitPrice.toFixed(2)} ₽{' '}
                        <span className='text-xs text-muted-foreground font-normal'>
                            (базовая {unitPrice.toFixed(2)} ₽ + доплата {totalDelta.toFixed(2)} ₽)
                        </span>
                    </div>
                </div>
                <Button size='sm' onClick={handleSubmit} disabled={busy}>
                    Отправить оффер
                </Button>
            </div>
        </div>
    )
}

function OffersList({offers, activeId}: { offers: ReadonlyArray<OfferDTO>; activeId: number | null }) {
    if (offers.length === 0) {
        return <p className='text-sm text-muted-foreground'>Офферов пока нет — дождитесь предложения продавца.</p>
    }
    return (
        <div className='space-y-2'>
            <h5 className='text-sm font-semibold'>Офферы</h5>
            {offers.map((o) => {
                const isActive = o.id === activeId
                return (
                    <div
                        key={o.id}
                        className={`rounded border p-2 text-sm ${
                            isActive ? 'border-mint-frosting bg-mint-frosting/20' : 'border-muted opacity-70'
                        }`}
                    >
                        <div className='flex items-center justify-between'>
                            <span>
                                Оффер v{o.version} · доплата {o.priceDelta.toFixed(2)} руб.
                            </span>
                            <Badge variant={isActive ? 'default' : 'outline'}>
                                {isActive ? 'актуален' : 'устарел'}
                            </Badge>
                        </div>
                        {o.spec.sellerNotes && (
                            <div className='text-xs text-muted-foreground mt-1'>
                                Заметки: {o.spec.sellerNotes}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
