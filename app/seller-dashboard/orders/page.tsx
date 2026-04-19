'use client'

import {useEffect, useState} from 'react'
import {useUser} from '@/contexts/user-context'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Input} from '@/components/ui/input'
import {LayoutList, LayoutDashboard} from 'lucide-react'

import {statusTranslations} from '@/components/order-card'
import {OrderStatus} from '@/app/orders/page'
import {StatusBadge} from '@/components/StatusBadge'
import {exportOrderSmeta} from '@/app/actions/exportData'
import {downloadCsv} from '@/lib/downloadCsv'

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderFull {
  id: string;
  date: string;
  customer: {
    name: string;
    email: string;
      address: string;
  };
  items: OrderItem[];
  total: number;
  status: string;
  paymentMethod: string;
  address: string;
}

const ALL_STATUSES: { value: string; label: string }[] = [
    {value: 'ordering', label: 'Новый'},
    {value: 'processing', label: 'В обработке'},
    {value: 'payed', label: 'Оплачен'},
    {value: 'in_progress', label: 'Готовится'},
    {value: 'delivering', label: 'Отправлен'},
    {value: 'delivered', label: 'Доставлен'},
    {value: 'cancelled', label: 'Отменён'},
]

const KANBAN_COLUMNS = [
    {key: 'new', label: 'Новые', statuses: ['ordering']},
    {key: 'processing', label: 'В обработке', statuses: ['processing', 'payed', 'in_progress']},
    {key: 'shipping', label: 'Отправлены', statuses: ['delivering']},
    {key: 'done', label: 'Доставлены', statuses: ['delivered']},
]

export default function SellerOrdersPage() {
    const {sellerId} = useUser()
    const [orders, setOrders] = useState<OrderFull[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortOrder, setSortOrder] = useState('newest')
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const resp = await fetch('/api/orders', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({order_id: parseInt(orderId), order_status: newStatus}),
            })
            if (!resp.ok) throw new Error('Failed to update order status')
            setOrders(prev =>
                prev.map(o => o.id === orderId ? {...o, status: newStatus} : o)
            )
        } catch (err) {
            console.error('Error updating order status:', err)
        }
    }

    useEffect(() => {
        if (!sellerId) return

        const fetchSellerOrders = async () => {
            try {
                setLoading(true)
                const response = await fetch(`/api/seller/orders?sellerId=${sellerId}`)
                if (!response.ok) throw new Error(`Failed to fetch orders: ${response.status}`)
                const data = await response.json()
                setOrders(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load orders')
            } finally {
                setLoading(false)
            }
        }

        fetchSellerOrders()
    }, [sellerId])

    const filteredOrders = orders.filter(order => {
        if (searchTerm === '') return true
        const searchLower = searchTerm.toLowerCase()
        return (
            order.id.toLowerCase().includes(searchLower) ||
      order.customer.name.toLowerCase().includes(searchLower) ||
      order.customer.email.toLowerCase().includes(searchLower)
        )
    })

    const statusFilteredOrders = statusFilter === 'all'
        ? filteredOrders
        : filteredOrders.filter(order => {
            const statusMap: Record<string, string> = {
                'ordering': 'processing', 'processing': 'processing',
                'in_progress': 'processing', 'payed': 'processing',
                'delivering': 'shipped', 'delivered': 'delivered', 'cancelled': 'cancelled'
            }
            return statusMap[order.status] === statusFilter
        })

    const sortedOrders = [...statusFilteredOrders].sort((a, b) => {
        switch (sortOrder) {
            case 'newest':
                return new Date(b.date).getTime() - new Date(a.date).getTime()
            case 'oldest':
                return new Date(a.date).getTime() - new Date(b.date).getTime()
            case 'total-desc':
                return b.total - a.total
            case 'total-asc':
                return a.total - b.total
            default:
                return 0
        }
    })

    if (loading) return <div className='text-center py-10'>Загрузка заказов...</div>
    if (error) return <div className='text-center py-10 text-red-500'>Ошибка: {error}</div>

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-2xl font-bold tracking-tight'>Заказы</h2>
                    <p className='text-muted-foreground'>Просмотр и управление заказами клиентов</p>
                </div>
                <div className='flex gap-2'>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => setViewMode('list')}
                    >
                        <LayoutList className='h-4 w-4 mr-1'/>
                    Список
                    </Button>
                    <Button
                        variant={viewMode === 'kanban' ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => setViewMode('kanban')}
                    >
                        <LayoutDashboard className='h-4 w-4 mr-1'/>
                    Канбан
                    </Button>
                </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-4 items-end justify-between'>
                <div className='grid gap-2 w-full sm:max-w-[360px]'>
                    <Input
                        placeholder='Поиск заказов по ID или клиенту...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {viewMode === 'list' && (
                    <div className='flex flex-wrap gap-2 w-full sm:w-auto'>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className='w-[140px]'>
                                <SelectValue placeholder='Статус заказа'/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>Все заказы</SelectItem>
                                <SelectItem value='processing'>В обработке</SelectItem>
                                <SelectItem value='shipped'>Отправлены</SelectItem>
                                <SelectItem value='delivered'>Доставлены</SelectItem>
                                <SelectItem value='cancelled'>Отменены</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortOrder} onValueChange={setSortOrder}>
                            <SelectTrigger className='w-[120px]'>
                                <SelectValue placeholder='Сортировка'/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='newest'>Новые</SelectItem>
                                <SelectItem value='oldest'>Старые</SelectItem>
                                <SelectItem value='total-desc'>Высокая сумма</SelectItem>
                                <SelectItem value='total-asc'>Низкая сумма</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {viewMode === 'kanban' ? (
                <KanbanBoard orders={filteredOrders} onStatusChange={handleStatusChange}/>
            ) : (
                <Tabs defaultValue='all' className='w-full'>
                    <TabsList className='w-full sm:w-auto grid grid-cols-4 sm:flex'>
                        <TabsTrigger value='all' className='flex-1 sm:flex-auto'>Все заказы</TabsTrigger>
                        <TabsTrigger value='processing' className='flex-1 sm:flex-auto'>В обработке</TabsTrigger>
                        <TabsTrigger value='shipped' className='flex-1 sm:flex-auto'>Отправлены</TabsTrigger>
                        <TabsTrigger value='delivered' className='flex-1 sm:flex-auto'>Доставлены</TabsTrigger>
                    </TabsList>

                    {sortedOrders.length === 0 ? (
                        <div className='text-center py-10 text-muted-foreground'>Заказы не найдены</div>
                    ) : (
                        <>
                            <TabsContent value='all' className='mt-4 space-y-4'>
                                {sortedOrders.map((order) => (
                                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange}/>
                                ))}
                            </TabsContent>
                            <TabsContent value='processing' className='mt-4 space-y-4'>
                                {sortedOrders.filter(o => ['ordering', 'processing', 'payed', 'in_progress'].includes(o.status)).map((order) => (
                                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange}/>
                                ))}
                            </TabsContent>
                            <TabsContent value='shipped' className='mt-4 space-y-4'>
                                {sortedOrders.filter(o => o.status === 'delivering').map((order) => (
                                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange}/>
                                ))}
                            </TabsContent>
                            <TabsContent value='delivered' className='mt-4 space-y-4'>
                                {sortedOrders.filter(o => o.status === 'delivered').map((order) => (
                                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange}/>
                                ))}
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            )}
        </div>
    )
}

function KanbanBoard({orders, onStatusChange}: {
    orders: OrderFull[];
    onStatusChange: (id: string, status: string) => void
}) {
    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            {KANBAN_COLUMNS.map(col => {
                const colOrders = orders.filter(o => col.statuses.includes(o.status))
                return (
                    <div key={col.key} className='flex flex-col gap-3'>
                        <div className='flex items-center justify-between px-1'>
                            <h3 className='font-semibold text-sm'>{col.label}</h3>
                            <Badge variant='outline'>{colOrders.length}</Badge>
                        </div>
                        <div className='flex flex-col gap-2 min-h-[100px] p-2 rounded-lg bg-muted/40'>
                            {colOrders.length === 0 && (
                                <p className='text-xs text-muted-foreground text-center py-4'>Нет заказов</p>
                            )}
                            {colOrders.map(order => (
                                <KanbanCard key={order.id} order={order} onStatusChange={onStatusChange}/>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function KanbanCard({order, onStatusChange}: {
    order: OrderFull;
    onStatusChange: (id: string, status: string) => void
}) {
    const displayStatus = statusTranslations[order.status as OrderStatus] || order.status
    const nextStatuses = getNextStatuses(order.status)

    return (
        <Card className='p-3 cursor-default'>
            <div className='flex items-center justify-between mb-1'>
                <span className='text-xs font-medium text-muted-foreground'>#{order.id}</span>
                <Badge variant='outline' className='text-xs'>{displayStatus}</Badge>
            </div>
            <div className='text-sm font-medium truncate'>{order.customer.name}</div>
            <div className='text-sm text-muted-foreground'>{order.total.toFixed(0)} руб.</div>
            {nextStatuses.length > 0 && (
                <div className='mt-2 flex flex-wrap gap-1'>
                    {nextStatuses.map(s => (
                        <Button
                            key={s.value}
                            size='sm'
                            variant='outline'
                            className='text-xs h-6 px-2'
                            onClick={() => onStatusChange(order.id, s.value)}
                        >
                            → {s.label}
                        </Button>
                    ))}
                </div>
            )}
        </Card>
    )
}

function getNextStatuses(current: string): { value: string; label: string }[] {
    const flow: Record<string, string[]> = {
        ordering: ['processing'],
        processing: ['in_progress'],
        in_progress: ['delivering'],
        payed: ['in_progress'],
        delivering: ['delivered'],
        delivered: [],
        cancelled: [],
    }
    const next = flow[current] || []
    return ALL_STATUSES.filter(s => next.includes(s.value))
}

function OrderCard({ order, onStatusChange }: { order: OrderFull; onStatusChange: (orderId: string, newStatus: string) => void }) {
    return (
        <Card>
            <CardHeader className='pb-2'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
                    <div>
                        <div className='flex items-center gap-2'>
                            <CardTitle className='text-base'>Заказ #{order.id}</CardTitle>
                            <StatusBadge status={order.status} type='order'/>
                        </div>
                        <CardDescription>{order.date}</CardDescription>
                    </div>
                    <div className='text-right'>
                        <div className='font-semibold'>{order.total.toFixed(2)} руб.</div>
                        <div className='text-sm text-muted-foreground'>
                            {order.items.length} {order.items.length === 1 ? 'товар' : order.items.length < 5 ? 'товара' : 'товаров'}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className='pb-2'>
                <div className='space-y-4'>
                    <div>
                        <h4 className='text-sm font-medium mb-1'>Информация о клиенте</h4>
                        <div className='text-sm'>
                            <div>{order.customer.name}</div>
                            <div className='text-muted-foreground'>{order.customer.email}</div>
                        </div>
                    </div>
                    <div>
                        <h4 className='text-sm font-medium mb-1'>Товары в заказе</h4>
                        <ul className='text-sm space-y-1'>
                            {order.items.map((item, index) => (
                                <li key={index} className='flex justify-between'>
                                    <div>{item.quantity} x {item.name}</div>
                                    <div>{(item.price * item.quantity).toFixed(2)} руб.</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div>
                            <h4 className='text-sm font-medium mb-1'>Адрес доставки</h4>
                            <div className='text-sm'>{order.customer.address}</div>
                        </div>
                        <div>
                            <h4 className='text-sm font-medium mb-1'>Статус оплаты</h4>
                            <Badge variant='outline' className='font-normal'>Оплачен</Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardContent className='border-t pt-4'>
                <div className='flex flex-wrap gap-2 items-center justify-between'>
                    <div className='flex flex-wrap gap-2 items-center'>
                        <span className='text-sm text-muted-foreground'>Перевести в статус:</span>
                        <Select
                            value={order.status}
                            onValueChange={(val) => onStatusChange(order.id, val)}
                        >
                            <SelectTrigger className='w-[170px] h-8 text-sm'>
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                {ALL_STATUSES.map(s => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={async () => {
                            const csv = await exportOrderSmeta(parseInt(order.id))
                            downloadCsv(csv, `смета_заказ_${order.id}.csv`)
                        }}
                    >
                    Скачать смету
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
