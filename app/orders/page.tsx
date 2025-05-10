"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { OrderCard } from "@/components/order-card"
import { Search, Filter } from "lucide-react"

// Определение типа для заказов
type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';

type Order = {
    id: string;
    date: string;
    status: OrderStatus;
    statusHistory: Array<{
        status: OrderStatus;
        date: string | null;
        completed: boolean;
    }>;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        image: string;
    }>;
    total: number;
    address: string;
    paymentMethod: string;
    cancellationReason?: string;
};

// Пример данных заказов
const orders: Order[] = [
    {
        id: "ЗКЗ-7652",
        date: "15 мая 2025",
        status: "delivered",
        statusHistory: [
            { status: "placed", date: "15 мая 2025, 10:30", completed: true },
            { status: "confirmed", date: "15 мая 2025, 10:45", completed: true },
            { status: "preparing", date: "15 мая 2025, 11:15", completed: true },
            { status: "shipping", date: "15 мая 2025, 12:30", completed: true },
            { status: "delivered", date: "15 мая 2025, 14:15", completed: true },
        ],
        items: [
            { name: "Шоколадный торт", quantity: 1, price: 24.99, image: "/placeholder.svg?height=80&width=80" },
            { name: "Ассорти макарон", quantity: 2, price: 18.99, image: "/placeholder.svg?height=80&width=80" },
        ],
        total: 62.97,
        address: "ул. Кленовая, 123, г. Москва, 123456",
        paymentMethod: "Банковская карта",
    },
    {
        id: "ЗКЗ-7651",
        date: "12 мая 2025",
        status: "shipping",
        statusHistory: [
            { status: "placed", date: "12 мая 2025, 15:20", completed: true },
            { status: "confirmed", date: "12 мая 2025, 15:35", completed: true },
            { status: "preparing", date: "12 мая 2025, 16:10", completed: true },
            { status: "shipping", date: "12 мая 2025, 17:45", completed: true },
            { status: "delivered", date: null, completed: false },
        ],
        items: [{ name: "Клубничный чизкейк", quantity: 1, price: 22.99, image: "/placeholder.svg?height=80&width=80" }],
        total: 22.99,
        address: "ул. Дубовая, 456, г. Санкт-Петербург, 234567",
        paymentMethod: "Наличные при получении",
    },
    {
        id: "ЗКЗ-7650",
        date: "8 мая 2025",
        status: "preparing",
        statusHistory: [
            { status: "placed", date: "8 мая 2025, 09:15", completed: true },
            { status: "confirmed", date: "8 мая 2025, 09:30", completed: true },
            { status: "preparing", date: "8 мая 2025, 10:00", completed: true },
            { status: "shipping", date: null, completed: false },
            { status: "delivered", date: null, completed: false },
        ],
        items: [
            { name: "Тирамису в стаканчике", quantity: 2, price: 8.99, image: "/placeholder.svg?height=80&width=80" },
            { name: "Булочки с корицей", quantity: 1, price: 16.99, image: "/placeholder.svg?height=80&width=80" },
        ],
        total: 34.97,
        address: "ул. Сосновая, 789, г. Казань, 345678",
        paymentMethod: "Банковская карта",
    },
    {
        id: "ЗКЗ-7649",
        date: "5 мая 2025",
        status: "confirmed",
        statusHistory: [
            { status: "placed", date: "5 мая 2025, 18:45", completed: true },
            { status: "confirmed", date: "5 мая 2025, 19:00", completed: true },
            { status: "preparing", date: null, completed: false },
            { status: "shipping", date: null, completed: false },
            { status: "delivered", date: null, completed: false },
        ],
        items: [
            { name: "Шоколадный торт", quantity: 1, price: 24.99, image: "/placeholder.svg?height=80&width=80" },
            { name: "Клубничный чизкейк", quantity: 1, price: 22.99, image: "/placeholder.svg?height=80&width=80" },
            { name: "Ассорти макарон", quantity: 2, price: 18.99, image: "/placeholder.svg?height=80&width=80" },
        ],
        total: 85.96,
        address: "ул. Кедровая, 101, г. Екатеринбург, 456789",
        paymentMethod: "Банковская карта",
    },
    {
        id: "ЗКЗ-7648",
        date: "1 мая 2025",
        status: "placed",
        statusHistory: [
            { status: "placed", date: "1 мая 2025, 11:30", completed: true },
            { status: "confirmed", date: null, completed: false },
            { status: "preparing", date: null, completed: false },
            { status: "shipping", date: null, completed: false },
            { status: "delivered", date: null, completed: false },
        ],
        items: [
            { name: "Веганское шоколадное печенье", quantity: 2, price: 12.99, image: "/placeholder.svg?height=80&width=80" },
        ],
        total: 25.98,
        address: "ул. Березовая, 202, г. Сочи, 567890",
        paymentMethod: "Наличные при получении",
    },
    {
        id: "ЗКЗ-7647",
        date: "28 апреля 2025",
        status: "cancelled",
        statusHistory: [
            { status: "placed", date: "28 апреля 2025, 14:15", completed: true },
            { status: "confirmed", date: "28 апреля 2025, 14:30", completed: true },
            { status: "cancelled", date: "28 апреля 2025, 15:00", completed: true },
        ],
        items: [{ name: "Фруктовый тарт", quantity: 1, price: 19.99, image: "/placeholder.svg?height=80&width=80" }],
        total: 19.99,
        address: "ул. Липовая, 303, г. Новосибирск, 678901",
        paymentMethod: "Банковская карта",
        cancellationReason: "Клиент отменил заказ",
    },
]

export default function OrdersPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sortOrder, setSortOrder] = useState("newest")

    // Фильтрация и сортировка заказов
    const filteredOrders = orders
        .filter((order) => {
            // Фильтр по поиску
            if (searchTerm && !order.id.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false
            }

            // Фильтр по статусу
            return !(statusFilter !== "all" && order.status !== statusFilter);


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

            <div className="flex flex-col sm:flex-row gap-4 items-end justify-between mb-6">
                <div className="relative w-full sm:max-w-[360px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Поиск по номеру заказа..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Статус заказа" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все заказы</SelectItem>
                            <SelectItem value="placed">Оформлен</SelectItem>
                            <SelectItem value="confirmed">Подтвержден</SelectItem>
                            <SelectItem value="preparing">Готовится</SelectItem>
                            <SelectItem value="shipping">Доставляется</SelectItem>
                            <SelectItem value="delivered">Доставлен</SelectItem>
                            <SelectItem value="cancelled">Отменен</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Сортировка" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Сначала новые</SelectItem>
                            <SelectItem value="oldest">Сначала старые</SelectItem>
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
                        .filter((order) => ["placed", "confirmed", "preparing", "shipping"].includes(order.status))
                        .map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                </TabsContent>

                <TabsContent value="completed" className="space-y-6">
                    {filteredOrders
                        .filter((order) => ["delivered", "cancelled"].includes(order.status))
                        .map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                </TabsContent>
            </Tabs>
        </div>
    )
}
