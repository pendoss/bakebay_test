import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Пример данных
const orders = [
  {
    id: "ЗКЗ-7652",
    customer: "София Тейлор",
    initial: "СТ",
    items: 3,
    total: "$87.97",
    status: "В обработке",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 часа назад
  },
  {
    id: "ЗКЗ-7651",
    customer: "Джеймс Уилсон",
    initial: "ДУ",
    items: 1,
    total: "$24.99",
    status: "Отправлен",
    date: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 часов назад
  },
  {
    id: "ЗКЗ-7650",
    customer: "Эмма Джонсон",
    initial: "ЭД",
    items: 2,
    total: "$43.98",
    status: "Доставлен",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 день назад
  },
  {
    id: "ЗКЗ-7649",
    customer: "Ной Уильямс",
    initial: "НУ",
    items: 5,
    total: "$112.95",
    status: "Доставлен",
    date: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 дня назад
  },
  {
    id: "ЗКЗ-7648",
    customer: "Оливия Браун",
    initial: "ОБ",
    items: 2,
    total: "$37.98",
    status: "Доставлен",
    date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 дня назад
  },
]

export function RecentOrders() {
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center gap-4">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`/placeholder.svg?text=${order.initial}`} alt={order.customer} />
            <AvatarFallback>{order.initial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{order.customer}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{order.id}</span>
              <span>•</span>
              <span>{order.items} товаров</span>
              <span>•</span>
              <span>{formatDistanceToNow(order.date, { addSuffix: true, locale: ru })}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-medium">{order.total}</span>
            <Badge
              variant={
                order.status === "В обработке" ? "outline" : order.status === "Отправлен" ? "secondary" : "default"
              }
              className="text-xs"
            >
              {order.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
