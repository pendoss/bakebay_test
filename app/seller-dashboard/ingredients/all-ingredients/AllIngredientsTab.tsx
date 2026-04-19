'use client'

import {useEffect, useMemo, useState} from 'react'
import {Check, Pencil, X} from 'lucide-react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {StatusBadge} from '@/components/StatusBadge'
import {fetchIngredients} from '@/app/actions/fetchIngredients'
import {exportPurchaseList} from '@/app/actions/exportData'
import {downloadCsv} from '@/lib/downloadCsv'
import {observer} from 'mobx-react-lite'
import {useSellerId} from '@/src/adapters/ui/react/stores'
import {useIngredientAlerts} from '@/hooks/use-ingredient-alerts'
import {Ingredient} from '../types'

type EditForm = {
    stock: number
    alert: number
    purchase_qty: number
    purchase_price: number
}

export const AllIngredientsTab = observer(function AllIngredientsTab() {
    const sellerId = useSellerId()
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editForm, setEditForm] = useState<EditForm>({
        stock: 0,
        alert: 0,
        purchase_qty: 1,
        purchase_price: 0,
    })

    useIngredientAlerts(ingredients)

    useEffect(() => {
        let cancelled = false

        async function load() {
            setIsLoading(true)
            try {
                const {ingredients: data, error} = await fetchIngredients(sellerId)
                if (cancelled) return
                if (!error && data) setIngredients(data)
                else console.error('Error loading ingredients:', error)
            } catch (err) {
                console.error('Failed to load ingredients:', err)
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [sellerId])

    const filtered = useMemo(
        () =>
            ingredients
                .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name)),
        [ingredients, searchTerm]
    )

    const startEdit = (ing: Ingredient) => {
        setEditingId(ing.ingredient_id)
        setEditForm({
            stock: ing.stock,
            alert: ing.alert,
            purchase_qty: ing.purchase_qty,
            purchase_price: ing.purchase_price,
        })
    }

    const handleSave = async (ingredient_id: number) => {
        await fetch('/api/product-ingredients', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ingredient_id, ...editForm}),
        })
        setIngredients(prev =>
            prev.map(ing => (ing.ingredient_id === ingredient_id ? {...ing, ...editForm} : ing))
        )
        setEditingId(null)
    }

    const handleExport = async () => {
        if (!sellerId) return
        const csv = await exportPurchaseList(sellerId)
        downloadCsv(csv, `закупки_${new Date().toISOString().slice(0, 10)}.csv`)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Инвентарь ингредиентов</CardTitle>
                <CardDescription>Управляйте запасами ингредиентов и настройте оповещения о низком
                    запасе</CardDescription>
            </CardHeader>
            <CardContent>
                <div className='mb-4'>
                    <Input
                        placeholder='Поиск ингредиентов...'
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className='text-center py-8'>Загрузка ингредиентов...</div>
                ) : (
                    <div className='rounded-md border overflow-x-auto'>
                        <div className='grid grid-cols-12 gap-2 p-4 font-medium border-b min-w-[800px]'>
                            <div className='col-span-2'>Название</div>
                            <div className='col-span-1'>В наличии</div>
                            <div className='col-span-1'>Ед.</div>
                            <div className='col-span-2'>Объем закупки</div>
                            <div className='col-span-2'>Цена закупки</div>
                            <div className='col-span-1'>Цена/ед.</div>
                            <div className='col-span-1'>Статус</div>
                            <div className='col-span-1'>Порог</div>
                            <div className='col-span-1'></div>
                        </div>

                        <div className='divide-y min-w-[800px]'>
                            {filtered.length > 0 ? (
                                filtered.map(ingredient => {
                                    const isEditing = editingId === ingredient.ingredient_id
                                    const costPerUnit = isEditing
                                        ? editForm.purchase_qty > 0
                                            ? editForm.purchase_price / editForm.purchase_qty
                                            : 0
                                        : ingredient.purchase_qty > 0
                                            ? ingredient.purchase_price / ingredient.purchase_qty
                                            : 0

                                    return (
                                        <div
                                            key={ingredient.ingredient_id}
                                            className='grid grid-cols-12 gap-2 p-3 items-center'
                                        >
                                            <div className='col-span-2 font-medium'>{ingredient.name}</div>

                                            <div className='col-span-1'>
                                                {isEditing ? (
                                                    <Input
                                                        type='number'
                                                        className='h-8 px-2'
                                                        value={editForm.stock}
                                                        onChange={e => setEditForm(p => ({
                                                            ...p,
                                                            stock: Number(e.target.value)
                                                        }))}
                                                    />
                                                ) : (
                                                    ingredient.stock
                                                )}
                                            </div>

                                            <div className='col-span-1'>{ingredient.unit}</div>

                                            <div className='col-span-2'>
                                                {isEditing ? (
                                                    <Input
                                                        type='number'
                                                        className='h-8 px-2'
                                                        value={editForm.purchase_qty}
                                                        onChange={e =>
                                                            setEditForm(p => ({
                                                                ...p,
                                                                purchase_qty: Number(e.target.value)
                                                            }))
                                                        }
                                                    />
                                                ) : (
                                                    ingredient.purchase_qty
                                                )}
                                            </div>

                                            <div className='col-span-2'>
                                                {isEditing ? (
                                                    <Input
                                                        type='number'
                                                        className='h-8 px-2'
                                                        value={editForm.purchase_price}
                                                        onChange={e =>
                                                            setEditForm(p => ({
                                                                ...p,
                                                                purchase_price: Number(e.target.value)
                                                            }))
                                                        }
                                                    />
                                                ) : ingredient.purchase_price > 0 ? (
                                                    `${ingredient.purchase_price} ₽`
                                                ) : (
                                                    '—'
                                                )}
                                            </div>

                                            <div className='col-span-1 text-sm text-muted-foreground'>
                                                {costPerUnit > 0 ? `${costPerUnit.toFixed(2)} ₽` : '—'}
                                            </div>

                                            <div className='col-span-1'>
                                                <StatusBadge status={ingredient.status} type='stock'/>
                                            </div>

                                            <div className='col-span-1'>
                                                {isEditing ? (
                                                    <Input
                                                        type='number'
                                                        className='h-8 px-2'
                                                        value={editForm.alert}
                                                        onChange={e =>
                                                            setEditForm(p => ({...p, alert: Number(e.target.value)}))
                                                        }
                                                    />
                                                ) : ingredient.alert !== 0 ? (
                                                    ingredient.alert
                                                ) : (
                                                    10
                                                )}
                                            </div>

                                            <div className='col-span-1 flex gap-1'>
                                                {isEditing ? (
                                                    <>
                                                        <Button
                                                            size='icon'
                                                            variant='ghost'
                                                            className='h-7 w-7'
                                                            onClick={() => handleSave(ingredient.ingredient_id)}
                                                        >
                                                            <Check className='h-4 w-4 text-green-600'/>
                                                        </Button>
                                                        <Button
                                                            size='icon'
                                                            variant='ghost'
                                                            className='h-7 w-7'
                                                            onClick={() => setEditingId(null)}
                                                        >
                                                            <X className='h-4 w-4 text-red-500'/>
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        size='icon'
                                                        variant='ghost'
                                                        className='h-7 w-7'
                                                        onClick={() => startEdit(ingredient)}
                                                    >
                                                        <Pencil className='h-4 w-4'/>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className='text-center py-8 col-span-12'>Ингредиенты не найдены</div>
                            )}
                        </div>
                    </div>
                )}

                <div className='flex justify-end mt-4'>
                    <Button variant='outline' onClick={handleExport}>
                        Экспорт инвентаря
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
})
