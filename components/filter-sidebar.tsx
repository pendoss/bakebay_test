"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

declare global {
  interface Window {
    priceTimeout: ReturnType<typeof setTimeout>;
  }
}

const categoryTranslations: Record<string, string> = {
  Cakes: "Торты",
  Cookies: "Печенье",
  Pastries: "Выпечка",
  "Italian Desserts": "Итальянские десерты",
  Tarts: "Тарты",
  Brownies: "Брауни",
  "International Desserts": "Международные десерты",
  Pies: "Пироги",
  Chocolates: "Шоколад",
  Cupcakes: "Капкейки",
}

const dietaryTranslations: Record<string, string> = {
  "Gluten-Free": "Без глютена",
  Vegan: "Веганское",
  "Dairy-Free": "Без молочных продуктов",
  "Contains Nuts": "Содержит орехи",
  "Contains Gluten": "Содержит глютен",
  "Contains Dairy": "Содержит молочные продукты",
  "May Contain Nuts": "Может содержать орехи",
}

const categories = [
    "Cakes", "Cookies", "Pastries", "Italian Desserts", "Tarts",
    "Brownies", "International Desserts", "Pies", "Chocolates", "Cupcakes",
]

const dietaryOptions = [
    "Gluten-Free", "Vegan", "Dairy-Free",
    "Contains Nuts", "Contains Gluten", "Contains Dairy", "May Contain Nuts",
]

const ratingOptions = [
  { value: 4.9, label: "4.9 и выше" },
  { value: 4.7, label: "4.7 и выше" },
  { value: 4.5, label: "4.5 и выше" },
  { value: 4.0, label: "4.0 и выше" },
]

type Filters = {
  priceRange: [number, number];
  categories: string[];
  dietary: string[];
  rating: number;
    sellers: number[];
};

type ApplyFiltersAction = (filters: Filters) => void;

type AvailableSeller = { id: number; name: string };

export function FilterSidebar({
                                  filters,
                                  applyFiltersAction,
                                  minPrice = 0,
                                  maxPrice = 10000,
                              }: {
  filters: Filters;
  applyFiltersAction: ApplyFiltersAction;
    minPrice?: number;
    maxPrice?: number;
}) {
  const [localFilters, setLocalFilters] = useState(filters)
  const [priceRange, setPriceRange] = useState(filters.priceRange)
    const [availableSellers, setAvailableSellers] = useState<AvailableSeller[]>([])

  useEffect(() => {
    setLocalFilters(filters)
    setPriceRange(filters.priceRange)
  }, [filters])

    useEffect(() => {
        fetch("/api/sellers")
            .then((r) => r.ok ? r.json() : [])
            .then((data: { seller_id: number; seller_name: string }[]) =>
                setAvailableSellers(data.map((s) => ({id: s.seller_id, name: s.seller_name})))
            )
            .catch(() => {
            })
    }, [])

  const handleCategoryChange = (category: string, checked: boolean | "indeterminate") => {
    let newCategories = [...localFilters.categories]
      if (checked === true) newCategories.push(category)
      else newCategories = newCategories.filter((c) => c !== category)
    const newFilters = { ...localFilters, categories: newCategories }
    setLocalFilters(newFilters)
    applyFiltersAction(newFilters)
  }

  const handleDietaryChange = (option: string, checked: boolean | "indeterminate") => {
    let newDietary = [...localFilters.dietary]
      if (checked === true) newDietary.push(option)
      else newDietary = newDietary.filter((d) => d !== option)
    const newFilters = { ...localFilters, dietary: newDietary }
    setLocalFilters(newFilters)
    applyFiltersAction(newFilters)
  }

    const handleSellerChange = (sellerId: number, checked: boolean | "indeterminate") => {
    let newSellers = [...localFilters.sellers]
        if (checked === true) newSellers.push(sellerId)
        else newSellers = newSellers.filter((s) => s !== sellerId)
    const newFilters = { ...localFilters, sellers: newSellers }
    setLocalFilters(newFilters)
    applyFiltersAction(newFilters)
  }

  const handleRatingChange = (rating: number) => {
    const newFilters = { ...localFilters, rating }
    setLocalFilters(newFilters)
    applyFiltersAction(newFilters)
  }

  const handlePriceChange = (value: number[]) => {
    const priceRangeValue: [number, number] = [value[0], value[1]]
    setPriceRange(priceRangeValue)
    clearTimeout(window.priceTimeout)
    window.priceTimeout = setTimeout(() => {
      const newFilters = { ...localFilters, priceRange: priceRangeValue }
      setLocalFilters(newFilters)
      applyFiltersAction(newFilters)
    }, 300)
  }

  const handleReset = () => {
    const resetFilters: Filters = {
        priceRange: [minPrice, maxPrice] as [number, number],
      categories: [],
      dietary: [],
      rating: 0,
      sellers: [],
    }
    setLocalFilters(resetFilters)
      setPriceRange([minPrice, maxPrice])
    applyFiltersAction(resetFilters)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Фильтры</h3>
        <Button variant="outline" size="sm" onClick={handleReset} className="mb-4">
          Сбросить все
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Диапазон цен</h4>
          <Slider
            value={priceRange}
            min={minPrice}
            max={maxPrice}
            step={50}
            onValueChange={handlePriceChange}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{priceRange[0]} руб.</span>
            <span>{priceRange[1]} руб.</span>
          </div>
        </div>

        <Accordion type="multiple" defaultValue={["categories", "dietary", "rating", "sellers"]} className="w-full">
          <AccordionItem value="categories">
            <AccordionTrigger>Категории</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={localFilters.categories.includes(category)}
                      onCheckedChange={(checked) => handleCategoryChange(category, checked)}
                    />
                    <Label htmlFor={`category-${category}`}>{categoryTranslations[category] || category}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dietary">
            <AccordionTrigger>Диетические ограничения</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {dietaryOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dietary-${option}`}
                      checked={localFilters.dietary.includes(option)}
                      onCheckedChange={(checked) => handleDietaryChange(option, checked)}
                    />
                    <Label htmlFor={`dietary-${option}`}>{dietaryTranslations[option] || option}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="rating">
            <AccordionTrigger>Рейтинг</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {ratingOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`rating-${option.value}`}
                      checked={localFilters.rating === option.value}
                      onCheckedChange={(checked) => {
                        if (checked) handleRatingChange(option.value)
                        else handleRatingChange(0)
                      }}
                    />
                    <Label htmlFor={`rating-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sellers">
            <AccordionTrigger>Продавцы</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {availableSellers.map((seller) => (
                      <div key={seller.id} className="flex items-center space-x-2">
                    <Checkbox
                        id={`seller-${seller.id}`}
                        checked={localFilters.sellers.includes(seller.id)}
                        onCheckedChange={(checked) => handleSellerChange(seller.id, checked)}
                    />
                          <Label htmlFor={`seller-${seller.id}`} className="text-sm">
                              {seller.name}
                    </Label>
                  </div>
                ))}
                  {availableSellers.length === 0 && (
                      <p className="text-sm text-muted-foreground">Загрузка...</p>
                  )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
