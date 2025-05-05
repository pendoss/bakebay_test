import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

// Пример данных о продавцах
const sellers = [
  {
    id: 1,
    name: "Кондитерская Сладкие Радости",
    description: "Специализируется на авторских тортах и выпечке из органических ингредиентов",
    image: "/placeholder.svg?height=300&width=300",
    rating: 4.8,
    productsCount: 24,
    location: "Москва",
    specialties: ["Торты", "Выпечка", "Органик"],
    joinedDate: "Июнь 2020",
  },
  {
    id: 2,
    name: "Чизкейк Рай",
    description:
      "Премиальные чизкейки различных вкусов, от классического нью-йоркского до инновационных фьюжн-творений",
    image: "/placeholder.svg?height=300&width=300",
    rating: 4.9,
    productsCount: 18,
    location: "Санкт-Петербург",
    specialties: ["Чизкейки", "Без глютена"],
    joinedDate: "Август 2021",
  },
  {
    id: 3,
    name: "Парижские деликатесы",
    description: "Аутентичная французская выпечка и макароны от классически обученных кондитеров",
    image: "/placeholder.svg?height=300&width=300",
    rating: 4.7,
    productsCount: 32,
    location: "Казань",
    specialties: ["Макароны", "Французская выпечка", "Круассаны"],
    joinedDate: "Январь 2019",
  },
  {
    id: 4,
    name: "Утренняя пекарня",
    description: "Семейная пекарня, специализирующаяся на завтраках и булочках с корицей",
    image: "/placeholder.svg?height=300&width=300",
    rating: 4.6,
    productsCount: 15,
    location: "Екатеринбург",
    specialties: ["Булочки с корицей", "Выпечка для завтрака"],
    joinedDate: "Март 2022",
  },
  {
    id: 5,
    name: "Зеленые угощения",
    description: "Растительные и веганские десерты, которые так же вкусны, как и экологичны",
    image: "/placeholder.svg?height=300&width=300",
    rating: 4.5,
    productsCount: 22,
    location: "Новосибирск",
    specialties: ["Веганское", "Растительное", "Экологичное"],
    joinedDate: "Май 2021",
  },
  {
    id: 6,
    name: "Итальянские сладости",
    description: "Традиционные итальянские десерты по аутентичным рецептам, передаваемым из поколения в поколение",
    image: "/placeholder.svg?height=300&width=300",
    rating: 4.8,
    productsCount: 28,
    location: "Сочи",
    specialties: ["Тирамису", "Канноли", "Итальянские десерты"],
    joinedDate: "Октябрь 2020",
  },
]

export function SellersList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sellers.map((seller) => (
        <Card key={seller.id} className="overflow-hidden">
          <div className="aspect-[3/2] relative">
            <Image src={seller.image || "/placeholder.svg"} alt={seller.name} fill className="object-cover" />
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>{seller.name}</CardTitle>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-medium">{seller.rating}</span>
              </div>
            </div>
            <CardDescription>{seller.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Местоположение:</span>
                <span>{seller.location}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Товары:</span>
                <span>{seller.productsCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Присоединился:</span>
                <span>{seller.joinedDate}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {seller.specialties.map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Посмотреть товары</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
