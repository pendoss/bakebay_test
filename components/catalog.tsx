"use client"

import { useState, useEffect } from "react"
import { FilterSidebar } from "@/components/filter-sidebar"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

export function Catalog({ 
  initialCategory = null,
  initialFilters = null 
}:{ 
  initialCategory: string | null,
  initialFilters?: {
    priceRange: [number, number];
    categories: string[];
    dietary: string[];
    rating: number;
    sellers: string[];
  } | null
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    priceRange: [number, number];
    categories: string[];
    dietary: string[];
    rating: number;
    sellers: string[];
  }>(initialFilters || {
    priceRange: [0, 30] as [number, number],
    categories: initialCategory ? [initialCategory] : [],
    dietary: [],
    rating: 0,
    sellers: [],
  });

  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts()
  }, [])

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters based on filters
      const queryParams = new URLSearchParams()

      if (filters.categories.length > 0) {
        queryParams.append('category', filters.categories[0])
      }

      if (filters.sellers.length > 0) {
        queryParams.append('seller', filters.sellers[0])
      }

      // Fetch products from API
      const response = await fetch(`/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`)

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()

      // Apply client-side filtering
      const filteredProducts = applyClientSideFilters(data)
      setProducts(filteredProducts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters when filters change
  useEffect(() => {
    if (!loading) {
      fetchProducts()
    }
  }, [filters.categories, filters.sellers])

  // Apply client-side filters
  const applyClientSideFilters = (productsData: any[]) => {
    return productsData.filter((product) => {
      // Price filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false
      }

      // Rating filter
      if (filters.rating > 0 && (!product.rating || product.rating < filters.rating)) {
        return false
      }

      // Dietary constraints filter
      if (filters.dietary.length > 0) {
        // If product has no dietary_constraints or it's empty, filter it out
        if (!product.dietary_constraints || product.dietary_constraints.length === 0) {
          return false
        }

        // Check if any of the selected dietary constraints match the product's constraints
        const productDietaryNames = product.dietary_constraints.map((constraint: any) => constraint.name)
        if (!filters.dietary.some(diet => productDietaryNames.includes(diet))) {
          return false
        }
      }

      return true
    })
  }

  // Apply filters to products
  const applyFiltersAction = (newFilters: {
    priceRange: [number,number];
    categories: string[];
    dietary: string[];
    rating: number;
    sellers: string[];
  }) => {
    setFilters(newFilters)

    // If only client-side filters changed (price, rating, dietary), apply them without fetching
    if (
      newFilters.categories.toString() === filters.categories.toString() && 
      newFilters.sellers.toString() === filters.sellers.toString()
    ) {
      const filteredProducts = applyClientSideFilters(products)
      setProducts(filteredProducts)
    }
    // Otherwise, fetch products with new server-side filters
    else {
      fetchProducts()
    }
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
          <FilterSidebar filters={filters} applyFiltersAction={applyFiltersAction} />
        </div>
      </div>

      {/* Боковая панель фильтров - десктопная версия */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <FilterSidebar filters={filters} applyFiltersAction={applyFiltersAction} />
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
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchProducts()}
            >
              Попробовать снова
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={{
                    id: product.id,
                    name: product.name,
                    description: product.short_desc,
                    price: product.price,
                    image: product.image || "/placeholder.svg?height=200&width=200",
                    category: product.category,
                    dietary: product.dietary_constraints ? 
                      product.dietary_constraints.map((constraint: any) => constraint.name) : 
                      [],
                    rating: product.rating || 4.5,
                    seller: product.seller ? product.seller.name : "Unknown Seller",
                  }} 
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-medium">Нет товаров, соответствующих вашим фильтрам</h3>
                <p className="text-muted-foreground mt-2">Попробуйте изменить критерии фильтрации</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setFilters({
                      priceRange: [0, 30] as [number, number],
                      categories: [],
                      dietary: [],
                      rating: 0,
                      sellers: [],
                    });
                    fetchProducts();
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
