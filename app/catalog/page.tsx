"use client"
import { useSearchParams } from "next/navigation"
import { Catalog } from "@/components/catalog"
import {useMemo} from "react"

export default function CatalogPage() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")
  const sellerIdParam = searchParams.get("sellerId")

    const filters = useMemo(() => ({
    priceRange: [0, 10000] as [number, number],
    categories: categoryParam ? [categoryParam] : [],
    dietary: [] as string[],
    rating: 0,
    sellers: sellerIdParam ? [parseInt(sellerIdParam)] : [] as number[],
    }), [categoryParam, sellerIdParam])

  return (
    <div className="container py-10 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Все товары</h1>
        <p className="text-muted-foreground">Просмотрите наш выбор вкусных сладостей</p>
      </div>
      <Catalog initialCategory={categoryParam} initialFilters={filters} />
    </div>
  )
}
