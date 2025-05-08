import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

// Пример данных
const reviews = [
  {
    id: 1,
    customer: { name: "Эмили Джонсон", initials: "ЭД" },
    product: "Шоколадный торт",
    rating: 5,
    date: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 часа назад
    comment:
      "Абсолютно восхитительно! Торт был влажным, а глазурь идеальной. Обязательно закажу снова для особых случаев.",
    replied: true,
    reply: "Спасибо за ваши добрые слова, Эмили! Мы рады, что вам понравился наш Шоколадный торт.",
    replyDate: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 часа назад
  },
  {
    id: 2,
    customer: { name: "Михаил Смит", initials: "МС" },
    product: "Ассорти макарон",
    rating: 4,
    date: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 часов назад
    comment:
      "Отличные вкусы, хотя пара штук была слегка треснута при доставке. Всё равно вкусные и красиво оформленные.",
    replied: false,
  },
  {
    id: 3,
    customer: { name: "Сара Уилсон", initials: "СУ" },
    product: "Клубничный чизкейк",
    rating: 5,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 день назад
    comment:
      "Лучший чизкейк, который я когда-либо пробовала! Клубничная начинка была свежей и не слишком сладкой. Идеальный баланс вкусов.",
    replied: true,
    reply:
      "Мы очень рады, что вам понравился наш Клубничный чизкейк, Сара! Мы стараемся, чтобы наши фруктовые начинки были свежими и идеально сбалансированными.",
    replyDate: new Date(Date.now() - 1000 * 60 * 60 * 22), // 22 часа назад
  },
  {
    id: 4,
    customer: { name: "Джеймс Уилсон", initials: "ДУ" },
    product: "Веганское шоколадное печенье",
    rating: 3,
    date: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 дня назад
    comment: "Печенье имело хороший вкус, но было немного сухим. Предпочел бы, чтобы оно было более мягким.",
    replied: true,
    reply:
      "Спасибо за ваш отзыв, Джеймс. Нам жаль, что печенье не соответствовало вашим ожиданиям. Мы работаем над улучшением нашего веганского рецепта для более мягкой текстуры.",
    replyDate: new Date(Date.now() - 1000 * 60 * 60 * 30), // 30 часов назад
  },
  {
    id: 5,
    customer: { name: "Оливия Джонсон", initials: "ОД" },
    product: "Тирамису в стаканчике",
    rating: 5,
    date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 дня назад
    comment:
      "Тирамису было идеальным! Как раз правильное количество кофейного вкуса и такое кремовое. Индивидуальные стаканчики - отличная идея для контроля порций.",
    replied: false,
  },
]

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Отзывы о товарах</h2>
        <p className="text-muted-foreground">Управляйте и отвечайте на отзывы клиентов</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="grid gap-2 w-full sm:max-w-[360px]">
          <Input placeholder="Поиск отзывов по товару или клиенту..." />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select defaultValue="all">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Рейтинг" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все рейтинги</SelectItem>
              <SelectItem value="5">5 звезд</SelectItem>
              <SelectItem value="4">4 звезды</SelectItem>
              <SelectItem value="3">3 звезды</SelectItem>
              <SelectItem value="2">2 звезды</SelectItem>
              <SelectItem value="1">1 звезда</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="newest">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Новые</SelectItem>
              <SelectItem value="oldest">Старые</SelectItem>
              <SelectItem value="rating-desc">Высокий рейтинг</SelectItem>
              <SelectItem value="rating-asc">Низкий рейтинг</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="all" className="flex-1 sm:flex-auto">
            Все отзывы
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 sm:flex-auto">
            Ожидают ответа
          </TabsTrigger>
          <TabsTrigger value="replied" className="flex-1 sm:flex-auto">
            С ответом
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </TabsContent>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {reviews
            .filter((r) => !r.replied)
            .map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
        </TabsContent>

        <TabsContent value="replied" className="mt-4 space-y-4">
          {reviews
            .filter((r) => r.replied)
            .map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface reviewProps {
    review: {
        id: number
        customer: { name: string; initials: string }
        product: string
        rating: number
        date: Date | string | number
        comment: string
        replied?: boolean
        reply?: string
        replyDate?: Date | string | number
    }
}
function ReviewCard({ review } : reviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={`/placeholder.svg?text=${review.customer.initials}`} alt={review.customer.name} />
              <AvatarFallback>{review.customer.initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{review.customer.name}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(review.date, { addSuffix: true, locale: ru })}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "fill-muted text-muted-foreground"}`}
                  />
                ))}
            </div>
            <Badge variant={review.replied ? "default" : "outline"}>
              {review.replied ? "Есть ответ" : "Ожидает ответа"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Товар: {review.product}</h4>
          <div className="border rounded-lg p-3 bg-muted/50">
            <p className="text-sm">{review.comment}</p>
          </div>
        </div>

        {review.replied ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Ваш ответ:</h4>
            <div className="border rounded-lg p-3">
              <p className="text-sm">{review.reply}</p>
              { review.replyDate ? (
                  <p className="text-xs text-muted-foreground mt-2">
                    Ответ дан {formatDistanceToNow(review.replyDate, { addSuffix: true, locale: ru })}
                  </p>
              ): (
                  <p className="text-xs text-muted-foreground mt-2">
                    Ответ не был дан
                  </p>
              )}

            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Ответить на этот отзыв:</h4>
            <Textarea placeholder="Введите ваш ответ здесь..." className="min-h-[100px]" />
            <div className="flex gap-2">
              <Button size="sm">Отправить ответ</Button>
              <Button variant="outline" size="sm">
                Очистить
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
