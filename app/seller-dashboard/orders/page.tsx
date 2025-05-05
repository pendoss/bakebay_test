import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

// Пример данных
const orders = [
  {
    id: "ЗКЗ-7652",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 часа назад
    customer: {
      name: "София Тейлор",
      email: "sofia.t@example.com",
    },
    items: [
      { name: "Шоколадный торт", quantity: 1, price: 24.99 },
      { name: "Ассорти макарон", quantity: 2, price: 18.99 },
    ],
    total: 62.97,
    status: "В обработке",
    paymentStatus: "Оплачен",
    shippingAddress: "ул. Кленовая, 123, г. Москва, 123456",
  },
  {
    id: "ЗКЗ-7651",
    date: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 часов назад
    customer: {
      name: "Джеймс Уилсон",
      email: "james.w@example.com",
    },
    items: [{ name: "Клубничный чизкейк", quantity: 1, price: 22.99 }],
    total: 22.99,
    status: "Отправлен",
    paymentStatus: "Оплачен",
    shippingAddress: "ул. Дубовая, 456, г. Санкт-Петербург, 234567",
  },
  {
    id: "ЗКЗ-7650",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 день назад
    customer: {
      name: "Эмма Джонсон",
      email: "emma.j@example.com",
    },
    items: [
      { name: "Тирамису в стаканчике", quantity: 2, price: 8.99 },
      { name: "Булочки с корицей", quantity: 1, price: 16.99 },
    ],
    total: 34.97,
    status: "Доставлен",
    paymentStatus: "Оплачен",
    shippingAddress: "ул. Сосновая, 789, г. Казань, 345678",
  },
  {
    id: "ЗКЗ-7649",
    date: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 дня назад
    customer: {
      name: "Ной Уильямс",
      email: "noah.w@example.com",
    },
    items: [
      { name: "Шоколадный торт", quantity: 1, price: 24.99 },
      { name: "Клубничный чизкейк", quantity: 1, price: 22.99 },
      { name: "Ассорти макарон", quantity: 2, price: 18.99 },
      { name: "Булочки с корицей", quantity: 1, price: 16.99 },
    ],
    total: 102.95,
    status: "Доставлен",
    paymentStatus: "Оплачен",
    shippingAddress: "ул. Кедровая, 101, г. Екатеринбург, 456789",
  },
  {
    id: "ЗКЗ-7648",
    date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 дня назад
    customer: {
      name: "Оливия Браун",
      email: "olivia.b@example.com",
    },
    items: [{ name: "Веганское шоколадное печенье", quantity: 2, price: 12.99 }],
    total: 25.98,
    status: "Доставлен",
    paymentStatus: "Оплачен",
    shippingAddress: "ул. Березовая, 202, г. Сочи, 567890",
  },
]

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Заказы</h2>
        <p className="text-muted-foreground">Просмотр и управление заказами клиентов</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="grid gap-2 w-full sm:max-w-[360px]">
          <Input placeholder="Поиск заказов по ID или клиенту..." />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Статус заказа" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все заказы</SelectItem>
              <SelectItem value="processing">В обработке</SelectItem>
              <SelectItem value="shipped">Отправлены</SelectItem>
              <SelectItem value="delivered">Доставлены</SelectItem>
              <SelectItem value="cancelled">Отменены</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="newest">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Новые</SelectItem>
              <SelectItem value="oldest">Старые</SelectItem>
              <SelectItem value="total-desc">Высокая сумма</SelectItem>
              <SelectItem value="total-asc">Низкая сумма</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
          <TabsTrigger value="all" className="flex-1 sm:flex-auto">
            Все заказы
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex-1 sm:flex-auto">
            В обработке
          </TabsTrigger>
          <TabsTrigger value="shipped" className="flex-1 sm:flex-auto">
            Отправлены
          </TabsTrigger>
          <TabsTrigger value="delivered" className="flex-1 sm:flex-auto">
            Доставлены
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4 space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </TabsContent>
        <TabsContent value="processing" className="mt-4 space-y-4">
          {orders
            .filter((order) => order.status === "В обработке")
            .map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
        </TabsContent>
        <TabsContent value="shipped" className="mt-4 space-y-4">
          {orders
            .filter((order) => order.status === "Отправлен")
            .map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
        </TabsContent>
        <TabsContent value="delivered" className="mt-4 space-y-4">
          {orders
            .filter((order) => order.status === "Доставлен")
            .map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OrderCard({ order }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{order.id}</CardTitle>
              <Badge
                variant={
                  order.status === "В обработке" ? "outline" : order.status === "Отправлен" ? "secondary" : "default"
                }
              >
                {order.status}
              </Badge>
            </div>
            <CardDescription>
              Размещен {formatDistanceToNow(order.date, { addSuffix: true, locale: ru })}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="font-semibold">${order.total.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">
              {order.items.length} {order.items.length === 1 ? "товар" : order.items.length < 5 ? "товара" : "товаров"}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Информация о клиенте</h4>
            <div className="text-sm">
              <div>{order.customer.name}</div>
              <div className="text-muted-foreground">{order.customer.email}</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Товары в заказе</h4>
            <ul className="text-sm space-y-1">
              {order.items.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <div>
                    {item.quantity} x {item.name}
                  </div>
                  <div>${(item.price * item.quantity).toFixed(2)}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Адрес доставки</h4>
              <div className="text-sm">{order.shippingAddress}</div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Статус оплаты</h4>
              <Badge variant="outline" className="font-normal">
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
      <CardContent className="border-t pt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          Просмотреть детали
        </Button>
        {order.status === "В обработке" && <Button size="sm">Отметить как отправленный</Button>}
        {order.status === "Отправлен" && <Button size="sm">Отметить как доставленный</Button>}
        <Button variant="outline" size="sm">
          Распечатать счет
        </Button>
      </CardContent>
    </Card>
  )
}
