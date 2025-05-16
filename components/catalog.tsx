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
  console.log('Initial products state:', [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    priceRange: [number, number];
    categories: string[];
    dietary: string[];
    rating: number;
    sellers: string[];
  }>(initialFilters || {
    priceRange: [0, 10000] as [number, number],
    categories: initialCategory ? [initialCategory] : [],
    dietary: [],
    rating: 0,
    sellers: [],
  });

  // Fetch products when component mounts or filters change
  useEffect(() => {
    fetchProducts()
  }, [filters.categories, filters.sellers]) // Fetch when these filters change

  // Improved fetchProducts function
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
      const url = `/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Fetching products from URL:', url);

      const response = await fetch(url);
      console.log('API response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Failed to parse response as JSON')
      }

      // Ensure data is always an array
      console.log('API response data:', data);
      const productsArray = Array.isArray(data) ? data :
          (data && typeof data === 'object' && data.products && Array.isArray(data.products)) ?
              data.products : [];

      // Apply client-side filtering
      const filteredProducts = applyClientSideFilters(productsArray)

      setProducts(filteredProducts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }


  // Apply client-side filters
  const applyClientSideFilters = (productsData: any[]) => {
    console.log('Applying client-side filters to:', productsData);
    console.log('Current filters:', filters);

    if (!Array.isArray(productsData)) {
      console.error('productsData is not an array:', productsData);
      return [];
    }

    // If no products, return empty array
    if (productsData.length === 0) {
      console.log('No products to filter');
      return [];
    }

    // Log the first product to see its structure
    if (productsData.length > 0) {
      console.log('First product structure:', JSON.stringify(productsData[0], null, 2));
    }

    return productsData.filter((product) => {
      console.log('Filtering product:', product.name);

      // Price filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        console.log(`Product ${product.name} filtered out by price: ${product.price} not in range [${filters.priceRange[0]}, ${filters.priceRange[1]}]`);
        return false
      }

      // Rating filter
      if (filters.rating > 0 && (!product.rating || product.rating < filters.rating)) {
        console.log(`Product ${product.name} filtered out by rating: ${product.rating} < ${filters.rating}`);
        return false
      }

      // Dietary constraints filter
      if (filters.dietary.length > 0) {
        // If product has no dietary_constraints or it's empty, filter it out
        if (!product.dietary_constraints || product.dietary_constraints.length === 0) {
          console.log(`Product ${product.name} filtered out by dietary: no dietary constraints`);
          return false
        }

        // Check if any of the selected dietary constraints match the product's constraints
        const productDietaryNames = product.dietary_constraints.map((constraint: any) => constraint.name)
        if (!filters.dietary.some(diet => productDietaryNames.includes(diet))) {
          console.log(`Product ${product.name} filtered out by dietary: ${productDietaryNames} does not include any of ${filters.dietary}`);
          return false
        }
      }

      console.log(`Product ${product.name} passed all filters`);
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

  console.log('Products before rendering:', products);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 p-4 relative z-10">
            {products && products.length > 0 ? (
              products.map((product, index) => {
                // Skip invalid products
                if (!product || typeof product !== 'object') {
                  console.error('Invalid product:', product);
                  return null;
                }
                // Use ProductCard component
                console.log('Rendering product:', product.id, product.name, 'Image:', product.image);
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
                      dietary: product.dietary_constraints ? 
                        product.dietary_constraints.map((constraint: any) => constraint.name) : 
                        [],
                      rating: product.seller?.rating || 4.5,
                      seller: product.seller ? product.seller.name : "Unknown Seller",
                    }} 
                  />
                );
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
