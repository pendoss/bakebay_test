"use client"

import { useState, useEffect } from "react"
import { FilterSidebar } from "@/components/filter-sidebar"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

type CatalogFilters = {
  priceRange: [number, number];
  categories: string[];
  dietary: string[];
  rating: number;
  sellers: number[];
};

export function Catalog({
                          initialCategory = null,
                          initialFilters = null,
                        }: {
  initialCategory: string | null;
  initialFilters?: CatalogFilters | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalPriceRange, setGlobalPriceRange] = useState<[number, number]>([0, 10000])
  const [priceRangeReady, setPriceRangeReady] = useState(false)

  const [filters, setFilters] = useState<CatalogFilters>(
      initialFilters || {
        priceRange: [0, 10000] as [number, number],
        categories: initialCategory ? [initialCategory] : [],
        dietary: [],
        rating: 0,
        sellers: [],
      }
  )

  useEffect(() => {
    fetchProducts()
  }, [filters.categories, filters.sellers]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      if (filters.categories.length > 0) queryParams.append("category", filters.categories[0])
      if (filters.sellers.length > 0) queryParams.append("seller", filters.sellers[0].toString())

      const url = `/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`)

      const data = await response.json()
      const productsArray: any[] = Array.isArray(data)
          ? data
          : data?.products && Array.isArray(data.products)
              ? data.products
              : []

      // Compute global price range from raw data (before client filtering)
      if (!priceRangeReady && productsArray.length > 0) {
        const prices = productsArray
            .map((p: any) => p.price)
            .filter((p: any) => typeof p === "number" && !isNaN(p))
        if (prices.length > 0) {
          const min = Math.floor(Math.min(...prices))
          const max = Math.ceil(Math.max(...prices))
          setGlobalPriceRange([min, max])
          setPriceRangeReady(true)
          // Reset the price filter to the real range on first load
          setFilters((prev) => ({...prev, priceRange: [min, max] as [number, number]}))
        }
      }

      setProducts(applyClientSideFilters(productsArray))
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const applyClientSideFilters = (productsData: any[]) => {
    if (!Array.isArray(productsData) || productsData.length === 0) return []

    return productsData.filter((product) => {
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) return false
      if (filters.rating > 0 && (!product.rating || product.rating < filters.rating)) return false
      if (filters.dietary.length > 0) {
        if (!product.dietary_constraints?.length) return false
        const names = product.dietary_constraints.map((c: any) => c.name)
        if (!filters.dietary.some((d) => names.includes(d))) return false
      }
      return true
    })
  }

  const applyFiltersAction = (newFilters: CatalogFilters) => {
    setFilters(newFilters)
    const onlyClientSideChanged =
        newFilters.categories.toString() === filters.categories.toString() &&
      newFilters.sellers.toString() === filters.sellers.toString()

    if (onlyClientSideChanged) {
      setProducts(applyClientSideFilters(products))
    }
    // Otherwise the useEffect on filters.categories / filters.sellers triggers fetchProducts
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Кнопка фильтра для мобильных */}
      <div className="md:hidden flex justify-end mb-4">
        <Button variant="outline" onClick={() => setSidebarOpen(!sidebarOpen)} className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Фильтры
        </Button>
      </div>

      {/* Боковая панель — мобильная */}
      <div
          className={cn("fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden", sidebarOpen ? "block" : "hidden")}>
        <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-background p-6 shadow-lg">
          <Button variant="ghost" className="absolute right-4 top-4" onClick={() => setSidebarOpen(false)}>✕</Button>
          <FilterSidebar
              filters={filters}
              applyFiltersAction={applyFiltersAction}
              minPrice={globalPriceRange[0]}
              maxPrice={globalPriceRange[1]}
          />
        </div>
      </div>

      {/* Боковая панель — десктоп */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <FilterSidebar
            filters={filters}
            applyFiltersAction={applyFiltersAction}
            minPrice={globalPriceRange[0]}
            maxPrice={globalPriceRange[1]}
        />
      </div>

      {/* Сетка продуктов */}
      <div className="flex-1">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium">Загрузка продуктов...</h3>
            <p className="text-muted-foreground mt-2">Пожалуйста, подождите</p>
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium text-destructive">Ошибка загрузки продуктов</h3>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchProducts}>Попробовать снова</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 p-4 relative z-10">
            {products.length > 0 ? (
              products.map((product, index) => {
                if (!product || typeof product !== "object") return null
                return (
                    <ProductCard
                        key={product.id || `product-${index}`}
                    product={{
                      id: product.id || 0,
                      name: product.name || "Unknown Product",
                      description: product.short_desc || "",
                      price: product.price || 0,
                      image: product.image || "/placeholder.svg?height=200&width=200",
                      category: product.category_info ? product.category_info.name : (product.category || "Uncategorized"),
                      dietary: product.dietary_constraints
                          ? product.dietary_constraints.map((c: any) => c.name)
                          : [],
                      rating: product.seller?.rating || 4.5,
                      seller: product.seller ? product.seller.name : "Unknown Seller",
                      shelfLife: product.shelf_life ?? undefined,
                      storageConditions: product.storage_conditions ?? undefined,
                      size: product.size ?? undefined,
                    }}
                  />
                )
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-medium">Нет товаров, соответствующих вашим фильтрам</h3>
                <p className="text-muted-foreground mt-2">Попробуйте изменить критерии фильтрации</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setFilters({
                      priceRange: globalPriceRange,
                      categories: [],
                      dietary: [],
                      rating: 0,
                      sellers: [],
                    })
                    fetchProducts()
                  }}
                >
                  Сбросить фильтры
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
