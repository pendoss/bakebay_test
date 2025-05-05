"use client"

import { useState, useEffect } from "react"
import { FilterSidebar } from "@/components/filter-sidebar"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

// Данные о сладких продуктах
const initialProducts = [
  {
    id: 1,
    name: "Шоколадный торт",
    description: "Насыщенный шоколадный торт с помадкой",
    price: 24.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Cakes",
    dietary: ["Contains Gluten", "Contains Dairy"],
    rating: 4.8,
    seller: "Кондитерская Сладкие Радости",
  },
  {
    id: 2,
    name: "Клубничный чизкейк",
    description: "Кремовый чизкейк со свежей клубничной начинкой",
    price: 22.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Cakes",
    dietary: ["Contains Gluten", "Contains Dairy"],
    rating: 4.7,
    seller: "Чизкейк Рай",
  },
  {
    id: 3,
    name: "Ассорти макарон",
    description: "Коробка из 12 красочных французских макарон различных вкусов",
    price: 18.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Cookies",
    dietary: ["Contains Nuts", "Gluten-Free"],
    rating: 4.9,
    seller: "Парижские деликатесы",
  },
  {
    id: 4,
    name: "Булочки с корицей",
    description: "Свежеиспеченные булочки с корицей и глазурью из сливочного сыра",
    price: 16.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Pastries",
    dietary: ["Contains Gluten", "Contains Dairy"],
    rating: 4.6,
    seller: "Утренняя пекарня",
  },
  {
    id: 5,
    name: "Веганское шоколадное печенье",
    description: "Печенье с шоколадной крошкой на растительной основе",
    price: 12.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Cookies",
    dietary: ["Vegan", "Dairy-Free"],
    rating: 4.5,
    seller: "Зеленые угощения",
  },
  {
    id: 6,
    name: "Тирамису в стаканчике",
    description: "Индивидуальные порции десерта тирамису",
    price: 8.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Italian Desserts",
    dietary: ["Contains Gluten", "Contains Dairy"],
    rating: 4.7,
    seller: "Итальянские сладости",
  },
  {
    id: 7,
    name: "Фруктовый тарт",
    description: "Сливочная тарталетка с заварным кремом и свежими фруктами",
    price: 19.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Tarts",
    dietary: ["Contains Gluten", "Contains Dairy"],
    rating: 4.8,
    seller: "Дом тартов",
  },
  {
    id: 8,
    name: "Брауни без глютена",
    description: "Сочные шоколадные брауни без глютена",
    price: 14.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Brownies",
    dietary: ["Gluten-Free", "Contains Dairy"],
    rating: 4.6,
    seller: "Пекарня без аллергенов",
  },
  {
    id: 9,
    name: "Медовая пахлава",
    description: "Традиционная пахлава со слоями теста фило, орехами и медом",
    price: 17.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "International Desserts",
    dietary: ["Contains Gluten", "Contains Nuts"],
    rating: 4.9,
    seller: "Средиземноморские сладости",
  },
  {
    id: 10,
    name: "Лимонный пирог с безе",
    description: "Пикантная лимонная начинка под воздушным безе",
    price: 21.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Pies",
    dietary: ["Contains Gluten", "Contains Dairy"],
    rating: 4.7,
    seller: "Пирожный рай",
  },
  {
    id: 11,
    name: "Шоколадные трюфели",
    description: "Ассорти ручной работы шоколадных трюфелей",
    price: 25.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Chocolates",
    dietary: ["Contains Dairy", "May Contain Nuts"],
    rating: 4.9,
    seller: "Трюфельные мастера",
  },
  {
    id: 12,
    name: "Капкейки Красный бархат",
    description: "Классические капкейки Красный бархат с глазурью из сливочного сыра",
    price: 15.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Cupcakes",
    dietary: ["Contains Gluten", "Contains Dairy"],
    rating: 4.8,
    seller: "Капкейк уголок",
  },
]

export function Catalog({ initialCategory = null }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [products, setProducts] = useState(initialProducts)
  const [filters, setFilters] = useState({
    priceRange: [0, 30],
    categories: initialCategory ? [initialCategory] : [],
    dietary: [],
    rating: 0,
    sellers: [],
  })

  // Применяем начальный фильтр категории при монтировании компонента
  useEffect(() => {
    if (initialCategory) {
      applyFilters({
        ...filters,
        categories: [initialCategory],
      })
    }
  }, [initialCategory])

  // Применяем фильтры к продуктам
  const applyFilters = (newFilters) => {
    setFilters(newFilters)

    const filteredProducts = initialProducts.filter((product) => {
      // Фильтр по цене
      if (product.price < newFilters.priceRange[0] || product.price > newFilters.priceRange[1]) {
        return false
      }

      // Фильтр по категории
      if (newFilters.categories.length > 0 && !newFilters.categories.includes(product.category)) {
        return false
      }

      // Фильтр по диетическим ограничениям
      if (newFilters.dietary.length > 0 && !newFilters.dietary.some((diet) => product.dietary.includes(diet))) {
        return false
      }

      // Фильтр по рейтингу
      if (product.rating < newFilters.rating) {
        return false
      }

      // Фильтр по продавцу
      if (newFilters.sellers.length > 0 && !newFilters.sellers.includes(product.seller)) {
        return false
      }

      return true
    })

    setProducts(filteredProducts)
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Кнопка фильтра для мобильных устройств */}
      <div className="md:hidden flex justify-end mb-4">
        <Button variant="outline" onClick={() => setSidebarOpen(!sidebarOpen)} className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Фильтры
        </Button>
      </div>

      {/* Боковая панель фильтров - мобильная версия с оверлеем */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden",
          sidebarOpen ? "block" : "hidden",
        )}
      >
        <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-background p-6 shadow-lg">
          <Button variant="ghost" className="absolute right-4 top-4" onClick={() => setSidebarOpen(false)}>
            ✕
          </Button>
          <FilterSidebar filters={filters} applyFilters={applyFilters} />
        </div>
      </div>

      {/* Боковая панель фильтров - десктопная версия */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <FilterSidebar filters={filters} applyFilters={applyFilters} />
      </div>

      {/* Сетка продуктов */}
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.length > 0 ? (
            products.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium">Нет товаров, соответствующих вашим фильтрам</h3>
              <p className="text-muted-foreground mt-2">Попробуйте изменить критерии фильтрации</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setFilters({
                    priceRange: [0, 30],
                    categories: [],
                    dietary: [],
                    rating: 0,
                    sellers: [],
                  })
                  setProducts(initialProducts)
                }}
              >
                Сбросить фильтры
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
