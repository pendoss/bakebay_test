"use client"
import { useSearchParams } from "next/navigation"
import { Catalog } from "@/components/catalog"

// Словарь для перевода категорий
const categoryTranslations = {
  Cakes: "Торты",
  Pastries: "Выпечка",
  Cookies: "Печенье",
  Cupcakes: "Капкейки",
  Brownies: "Брауни",
  Pies: "Пироги",
  Chocolates: "Шоколад",
  "Vegan Desserts": "Веганские десерты",
  "Gluten-Free": "Без глютена",
  "Italian Desserts": "Итальянские десерты",
  Tarts: "Тарты",
  "International Desserts": "Международные десерты",
}

export default function CatalogPage() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")

  // Переводим название категории, если оно есть
  const translatedCategory = categoryParam ? categoryTranslations[categoryParam] || categoryParam : null

  return (
    <div className="container py-10 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Все товары
        </h1>
        <p className="text-muted-foreground">
          Просмотрите наш выбор вкусных сладостей
        </p>
      </div>
      <Catalog initialCategory={categoryParam} />
    </div>
  )
}
