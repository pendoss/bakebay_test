"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrderCard } from "@/components/order-card"
import { Filter, Images } from "lucide-react"

// Определение типа для заказов
export type OrderStatus = 'ordering' | 'processing' | 'payed' | 'processed' | 'in_progress' | 'delivering' | 'delivered' | 'placed' | 'confirmed' | 'preparing' | 'shipping' | 'cancelled';


// order_id: integer().primaryKey().generatedAlwaysAsIdentity(),
//     date: timestamp().notNull(),
//     order_status: orderStatusEnum().default('ordering'),
//     user_id: integer().references(() => users.user_id),
//     total_price: integer(),
//     address: text().notNull(),
//     payment_method: text().notNull(),
//     created_at: integer(),
//     updated_at: integer(),
type Order= {
    id: string;
    date: string;
    orderStatus: OrderStatus;
    totalPrice: number;
    address: string;
    paymentMethod: string;
    cancellationReason ? : string;
    user_id: number;
    items: Array < {
        name: string;
        price: number;
        image ? : string;
        quantity: number;
    } > ;
    statusHistory: Array < {
        status: OrderStatus;
        completed ? : boolean;
        date ? : string | null;
    } > ;
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sortOrder, setSortOrder] = useState("newest")

    // Fetch orders from the API
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true)
                
                // Get the current user ID from localStorage or other auth mechanism
                const userData = JSON.parse(localStorage.getItem('userData') || '{"id": 2}');
                const userId = userData.id;
                
                // Fetch orders for the specific user
                const response = await fetch(`/api/orders?userId=${userId}`)

                if (!response.ok) {
                    throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`)
                }

                const data = await response.json()
                
                // Transform API data to match our component's expected format
                const formattedOrders = data.map((order: any) => ({
                    id: order.id,
                    date: order.date,
                    orderStatus: order.status,
                    totalPrice: order.total || 0,
                    address: order.address,
                    paymentMethod: order.paymentMethod,
                    user_id: userId,
                    items: order.items || [],
                    images: order.images || [],
                    statusHistory: [
                        { status: 'placed', date: order.date, completed: true },
                        { status: 'confirmed', date: order.status === 'ordering' ? null : order.date, completed: order.status !== 'ordering' },
                        { status: 'preparing', date: ['ordering', 'processing'].includes(order.status) ? null : order.date, completed: !['ordering', 'processing'].includes(order.status) },
                        { status: 'shipping', date: ['delivering', 'delivered'].includes(order.status) ? order.date : null, completed: ['delivering', 'delivered'].includes(order.status) },
                        { status: 'delivered', date: order.status === 'delivered' ? order.date : null, completed: order.status === 'delivered' },
                    ]
                }))

                setOrders(formattedOrders)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
                console.error('Error fetching orders:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()
    }, [])

    // Фильтрация и сортировка заказов
    const filteredOrders = orders
        .filter((order) => {
            // Фильтр по поиску
            if (searchTerm && !order.id.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false
            }

            // Фильтр по статусу
            return !(statusFilter !== "all" && order.orderStatus !== statusFilter);
        })
        .sort((a, b) => {
            // Сортировка по дате
            const dateA = new Date(a.date.split(" ").reverse().join("-"))
            const dateB = new Date(b.date.split(" ").reverse().join("-"))

            if (sortOrder === "newest") {
                return dateB.getTime() - dateA.getTime()
            } else {
                return dateA.getTime() - dateB.getTime()
            }
        })

    return (
        <div className="container py-10 px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Мои заказы</h1>
                    <p className="text-muted-foreground">Просматривайте и отслеживайте ваши заказы</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-mint-frosting hover:bg-pistachio text-secondary">
                        Помощь с заказом
                    </Button>
                </div>
            </div>

            {/* Show loading state */}
            {loading && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="rounded-full bg-muted p-3 mb-4 animate-pulse">
                            <div className="h-6 w-6 bg-muted-foreground rounded-full"></div>
                        </div>
                        <h3 className="text-lg font-medium mb-2">Загрузка заказов...</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            Пожалуйста, подождите, пока мы загружаем ваши заказы.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Show error state */}
            {error && !loading && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="rounded-full bg-red-100 p-3 mb-4">
                            <div className="h-6 w-6 text-red-500">!</div>
                        </div>
                        <h3 className="text-lg font-medium mb-2">Ошибка загрузки заказов</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            {error}. Пожалуйста, попробуйте обновить страницу.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Show content when not loading and no error */}
            {!loading && !error && (
                <>
                    <div className="flex flex-col sm:flex-row gap-4 items-end justify-between mb-6">
                        {/*<div className="relative w-full sm:max-w-[360px]">*/}
                        {/*    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />*/}
                        {/*    <Input*/}
                        {/*        placeholder="Поиск по номеру заказа..."*/}
                        {/*        className="pl-8"*/}
                        {/*        value={searchTerm}*/}
                        {/*        onChange={(e) => setSearchTerm(e.target.value)}*/}
                        {/*    />*/}
                        {/*</div>*/}
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Статус заказа" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все заказы</SelectItem>
                                    <SelectItem value="ordering">Оформляется</SelectItem>
                                    <SelectItem value="processing">Обрабатывается</SelectItem>
                                    <SelectItem value="payed">Оплачен</SelectItem>
                                    <SelectItem value="processed">Обработан</SelectItem>
                                    <SelectItem value="in_progress">В процессе</SelectItem>
                                    <SelectItem value="delivering">Доставляется</SelectItem>
                                    <SelectItem value="delivered">Доставлен</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex mb-6">
                            <TabsTrigger value="all" className="flex-1 sm:flex-auto">
                                Все заказы
                            </TabsTrigger>
                            <TabsTrigger value="active" className="flex-1 sm:flex-auto">
                                Активные
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="flex-1 sm:flex-auto">
                                Завершенные
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="space-y-6">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)
                            ) : (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <div className="rounded-full bg-muted p-3 mb-4">
                                            <Filter className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium mb-2">Заказы не найдены</h3>
                                        <p className="text-muted-foreground text-center max-w-md">
                                            Не найдено заказов, соответствующих вашим критериям поиска. Попробуйте изменить параметры фильтрации.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="active" className="space-y-6">
                            {filteredOrders
                                .filter((order) => ["ordering", "processing", "payed", "processed", "in_progress", "delivering"].includes(order.orderStatus))
                                .map((order) => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                        </TabsContent>

                        <TabsContent value="completed" className="space-y-6">
                            {filteredOrders
                                .filter((order) => ["delivered"].includes(order.orderStatus))
                                .map((order) => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    )
}
