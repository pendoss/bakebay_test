import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

// Пример данных
const reviews = [
  {
    id: 1,
    customer: "Эмили Джонсон",
    initial: "ЭД",
    product: "Шоколадный торт",
    rating: 5,
    comment: "Абсолютно восхитительно! Торт был влажным, а глазурь идеальной.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 часа назад
  },
  {
    id: 2,
    customer: "Михаил Смит",
    initial: "МС",
    product: "Ассорти макарон",
    rating: 4,
    comment: "Отличные вкусы, хотя пара штук была слегка треснута при доставке.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 часов назад
  },
  {
    id: 3,
    customer: "Сара Уилсон",
    initial: "СУ",
    product: "Клубничный чизкейк",
    rating: 5,
    comment: "Лучший чизкейк, который я когда-либо пробовала! Обязательно закажу снова.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 день назад
  },
]

export function RecentReviews() {
  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
          <div className="flex items-center gap-4 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`/placeholder.svg?text=${review.initial}`} alt={review.customer} />
              <AvatarFallback>{review.initial}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{review.customer}</p>
              <p className="text-xs text-muted-foreground">{review.product}</p>
            </div>
            <div className="ml-auto flex">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < review.rating ? "fill-primary text-primary" : "fill-muted text-muted-foreground"}`}
                  />
                ))}
            </div>
          </div>
          <p className="text-sm">{review.comment}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(review.date, { addSuffix: true, locale: ru })}
          </p>
        </div>
      ))}
    </div>
  )
}
