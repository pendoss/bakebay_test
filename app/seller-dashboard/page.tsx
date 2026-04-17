"use client"

import {useEffect, useState} from "react"
import {useUser} from "@/contexts/user-context"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Overview} from "@/components/seller-dashboard/overview"
import {RecentOrders} from "@/components/seller-dashboard/recent-orders"
import {RecentReviews} from "@/components/seller-dashboard/recent-reviews"
import {
    AreaChart,
    BarChart,
    DollarSign,
    Package,
    ShoppingBag,
    Star,
    TrendingDown,
    TrendingUp,
    Users
} from "lucide-react"
import {Skeleton} from "@/components/ui/skeleton"
import {formatPrice} from "@/lib/formatters"

interface Analytics {
    kpis: {
        total_revenue: number
        orders_count: number
        unique_customers: number
        avg_order_value: number
        avg_rating: number
        products_count: number
        revenue_change: number
        orders_change: number
    }
    monthly_data: { name: string; revenue: number; orders: number }[]
    top_products: { name: string; quantity: number; revenue: number }[]
    recent_orders: {
        id: string; date: string; status: string | null
        customer: string; items_count: number; total: number
    }[]
    recent_reviews: {
        review_id: number; rating: number; comment: string
        created_at: string; customer: string; product: string
    }[]
}

function ChangeIndicator({ value }: { value: number }) {
    if (value === 0) return <span className="text-xs text-muted-foreground">без изменений</span>
    const Icon = value > 0 ? TrendingUp : TrendingDown
    const color = value > 0 ? "text-green-600" : "text-red-500"
    return (
        <span className={`text-xs flex items-center gap-1 ${color}`}>
            <Icon className="h-3 w-3" />
            {value > 0 ? "+" : ""}{value}% к прошлому месяцу
        </span>
    )
}

function KpiSkeleton() {
    return <Skeleton className="h-8 w-24 mt-1" />
}

export default function SellerDashboardPage() {
    const { sellerId } = useUser()
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!sellerId) return
        setLoading(true)
        let cancelled = false
        const loadAnalytics = async () => {
            try {
                const r = await fetch(`/api/seller/analytics?sellerId=${sellerId}`)
                if (cancelled) return
                const data = r.ok ? await r.json() : null
                if (data && !cancelled) setAnalytics(data)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        loadAnalytics()
        return () => {
            cancelled = true
        }
    }, [sellerId])

    const kpis = analytics?.kpis

    return (
        <div className="flex flex-col gap-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <KpiSkeleton /> : (
                            <>
                                <div className="text-2xl font-bold">{formatPrice(kpis?.total_revenue ?? 0)}</div>
                                <ChangeIndicator value={kpis?.revenue_change ?? 0}/>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <KpiSkeleton /> : (
                            <>
                                <div className="text-2xl font-bold">{kpis?.orders_count}</div>
                                <ChangeIndicator value={kpis?.orders_change ?? 0}/>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Товары</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <KpiSkeleton /> : (
                            <>
                                <div className="text-2xl font-bold">{kpis?.products_count}</div>
                                <p className="text-xs text-muted-foreground">
                                    Ср. чек: {formatPrice(kpis?.avg_order_value ?? 0)}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Клиенты / Рейтинг</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <KpiSkeleton /> : (
                            <>
                                <div className="text-2xl font-bold">{kpis?.unique_customers}</div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-primary text-primary" />
                                    {(kpis?.avg_rating ?? 0) > 0 ? kpis?.avg_rating : "—"} средний рейтинг
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview" className="flex gap-2 items-center">
                        <AreaChart className="h-4 w-4" />
                        Обзор
                    </TabsTrigger>
                    <TabsTrigger value="sales" className="flex gap-2 items-center">
                        <BarChart className="h-4 w-4" />
                        Топ товаров
                    </TabsTrigger>
                </TabsList>

                {/* Overview tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Доход по месяцам</CardTitle>
                                <CardDescription>Последние 12 месяцев</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                {loading
                                    ? <Skeleton className="h-[300px] w-full" />
                                    : <Overview data={analytics?.monthly_data ?? []}/>
                                }
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Последние заказы</CardTitle>
                                <CardDescription>
                                    {!loading && `Всего ${kpis?.orders_count} заказов`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading
                                    ? <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                                    : <RecentOrders orders={analytics?.recent_orders ?? []}/>
                                }
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Последние отзывы</CardTitle>
                                <CardDescription>
                                    {!loading && (kpis?.avg_rating ?? 0) > 0 && `Средний рейтинг: ${kpis?.avg_rating} ★`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading
                                    ? <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                                    : <RecentReviews reviews={analytics?.recent_reviews ?? []}/>
                                }
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Топ товаров</CardTitle>
                                <CardDescription>По выручке за всё время</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading
                                    ? <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                                    : analytics?.top_products.length === 0
                                        ? <p className="text-sm text-muted-foreground text-center py-4">Нет данных о продажах</p>
                                        : (
                                            <div className="space-y-4">
                                                {analytics?.top_products.map((product, i) => (
                                                    <div key={i} className="flex items-center">
                                                        <div className="w-6 text-sm text-muted-foreground font-medium">{i + 1}.</div>
                                                        <div className="flex-1 flex justify-between items-center">
                                                            <div className="font-medium text-sm truncate max-w-[180px]">{product.name}</div>
                                                            <div className="flex items-center gap-4 shrink-0">
                                                                <div className="text-sm text-muted-foreground">{product.quantity} шт.</div>
                                                                <div className="font-medium text-sm">{formatPrice(product.revenue)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                }
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Top products detail tab */}
                <TabsContent value="sales" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Продажи по товарам</CardTitle>
                            <CardDescription>Детальная статистика по каждому товару</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading
                                ? <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                                : analytics?.top_products.length === 0
                                    ? <p className="text-sm text-muted-foreground text-center py-8">Нет данных о продажах</p>
                                    : (
                                        <div className="rounded-md border">
                                            <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium border-b text-muted-foreground">
                                                <div className="col-span-1">#</div>
                                                <div className="col-span-5">Товар</div>
                                                <div className="col-span-3 text-right">Продано</div>
                                                <div className="col-span-3 text-right">Выручка</div>
                                            </div>
                                            <div className="divide-y">
                                                {analytics?.top_products.map((product, i) => {
                                                    const maxRevenue = analytics?.top_products[0].revenue
                                                    const barWidth = maxRevenue > 0 ? (product.revenue / maxRevenue * 100) : 0
                                                    return (
                                                        <div key={i} className="grid grid-cols-12 gap-4 p-3 items-center text-sm">
                                                            <div className="col-span-1 text-muted-foreground">{i + 1}</div>
                                                            <div className="col-span-5">
                                                                <div className="font-medium truncate">{product.name}</div>
                                                                <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary rounded-full"
                                                                        style={{ width: `${barWidth}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-span-3 text-right">{product.quantity} шт.</div>
                                                            <div className="col-span-3 text-right font-medium">
                                                                {formatPrice(product.revenue)}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                            }
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
