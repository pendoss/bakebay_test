import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/seller-dashboard/overview"
import { RecentOrders } from "@/components/seller-dashboard/recent-orders"
import { RecentReviews } from "@/components/seller-dashboard/recent-reviews"
import { AreaChart, BarChart, Calendar, DollarSign, Package, ShoppingBag, Users } from "lucide-react"

export default function SellerDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% по сравнению с прошлым месяцем</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+187</div>
            <p className="text-xs text-muted-foreground">+12.2% по сравнению с прошлым месяцем</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Товары</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">3 новых в этом месяце</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные клиенты</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">+54 новых клиента</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex gap-2 items-center">
            <AreaChart className="h-4 w-4" />
            Обзор
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex gap-2 items-center">
            <BarChart className="h-4 w-4" />
            Продажи
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex gap-2 items-center">
            <Calendar className="h-4 w-4" />
            Календарь
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Обзор</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Недавние заказы</CardTitle>
                <CardDescription>Вы получили 5 заказов на этой неделе</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentOrders />
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Самые продаваемые товары</CardTitle>
                <CardDescription>Ваши топ-5 товаров в этом месяце</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Шоколадный торт", quantity: 32, revenue: "$799.68" },
                    { name: "Клубничный чизкейк", quantity: 24, revenue: "$551.76" },
                    { name: "Ассорти макарон", quantity: 21, revenue: "$398.79" },
                    { name: "Булочки с корицей", quantity: 18, revenue: "$305.82" },
                    { name: "Тирамису в стаканчике", quantity: 15, revenue: "$134.85" },
                  ].map((product, i) => (
                    <div key={i} className="flex items-center">
                      <div className={`w-2 h-2 rounded-full bg-primary mr-2 opacity-${100 - i * 20}`} />
                      <div className="flex-1 flex justify-between items-center">
                        <div className="font-medium">{product.name}</div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-muted-foreground">{product.quantity} продано</div>
                          <div className="font-medium">{product.revenue}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Недавние отзывы</CardTitle>
                <CardDescription>Последние отзывы клиентов</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentReviews />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Информация о продажах</CardTitle>
              <CardDescription>Просмотр данных о продажах за период</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Здесь будет отображаться визуализация данных о продажах</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Календарь</CardTitle>
              <CardDescription>Расписание и важные даты</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Здесь будет отображаться интерфейс календаря</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
