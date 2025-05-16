"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Extend Window interface to include priceTimeout property
declare global {
  interface Window {
    priceTimeout: ReturnType<typeof setTimeout>;
  }
}

// Словарь для перевода категорий
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

// Словарь для перевода диетических опций
const dietaryTranslations: Record<string, string> = {
  "Gluten-Free": "Без глютена",
  Vegan: "Веганское",
  "Dairy-Free": "Без молочных продуктов",
  "Contains Nuts": "Содержит орехи",
  "Contains Gluten": "Содержит глютен",
  "Contains Dairy": "Содержит молочные продукты",
  "May Contain Nuts": "Может содержать орехи",
}

// Получаем уникальные значения для опций фильтра
const categories = [
  "Cakes",
  "Cookies",
  "Pastries",
  "Italian Desserts",
  "Tarts",
  "Brownies",
  "International Desserts",
  "Pies",
  "Chocolates",
  "Cupcakes",
]

const dietaryOptions = [
  "Gluten-Free",
  "Vegan",
  "Dairy-Free",
  "Contains Nuts",
  "Contains Gluten",
  "Contains Dairy",
  "May Contain Nuts",
]

const sellers = [
  "Кондитерская Сладкие Радости",
  "Чизкейк Рай",
  "Парижские деликатесы",
  "Утренняя пекарня",
  "Зеленые угощения",
  "Итальянские сладости",
  "Дом тартов",
  "Пекарня без аллергенов",
  "Средиземноморские сладости",
  "Пирожный рай",
  "Трюфельные мастера",
  "Капкейк уголок",
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
  sellers: string[];
};

type ApplyFiltersAction = (filters: Filters) => void;

export function FilterSidebar({filters, applyFiltersAction}: {
  filters: Filters;
  applyFiltersAction: ApplyFiltersAction;
}) {
  const [localFilters, setLocalFilters] = useState(filters)
  const [priceRange, setPriceRange] = useState(filters.priceRange)

  // Обновляем локальные фильтры при изменении пропсов
  useEffect(() => {
    setLocalFilters(filters)
    setPriceRange(filters.priceRange)
  }, [filters])

  const handleCategoryChange = (category: string, checked: boolean | "indeterminate") => {
    let newCategories = [...localFilters.categories]

    if (checked === true) {
      newCategories.push(category)
    } else {
      newCategories = newCategories.filter((c) => c !== category)
    }

    const newFilters = { ...localFilters, categories: newCategories }
    setLocalFilters(newFilters)
    applyFiltersAction(newFilters)
  }

  const handleDietaryChange = (option: string, checked: boolean | "indeterminate") => {
    let newDietary = [...localFilters.dietary]

    if (checked === true) {
      newDietary.push(option)
    } else {
      newDietary = newDietary.filter((d) => d !== option)
    }

    const newFilters = { ...localFilters, dietary: newDietary }
    setLocalFilters(newFilters)
    applyFiltersAction(newFilters)
  }

  const handleSellerChange = (seller: string, checked: boolean | "indeterminate") => {
    let newSellers = [...localFilters.sellers]

    if (checked === true) {
      newSellers.push(seller)
    } else {
      newSellers = newSellers.filter((s) => s !== seller)
    }

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

    // Задержка изменений цены, чтобы избежать слишком частых перерисовок
    clearTimeout(window.priceTimeout)
    window.priceTimeout = setTimeout(() => {
      const newFilters = { ...localFilters, priceRange: priceRangeValue }
      setLocalFilters(newFilters)
      applyFiltersAction(newFilters)
    }, 300)
  }

  const handleReset = () => {
    const resetFilters: Filters = {
      priceRange: [0, 10000] as [number, number],
      categories: [],
      dietary: [],
      rating: 0,
      sellers: [],
    }
    setLocalFilters(resetFilters)
    setPriceRange([0, 10000])
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
            defaultValue={priceRange}
            value={priceRange}
            max={10000}
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
                      onCheckedChange={(checked: boolean | "indeterminate") => handleCategoryChange(category, checked)}
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
                      onCheckedChange={(checked: boolean | "indeterminate") => handleDietaryChange(option, checked)}
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
                      onCheckedChange={(checked: boolean | "indeterminate") => {
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
                {sellers.map((seller) => (
                  <div key={seller} className="flex items-center space-x-2">
                    <Checkbox
                      id={`seller-${seller}`}
                      checked={localFilters.sellers.includes(seller)}
                      onCheckedChange={(checked: boolean | "indeterminate") => handleSellerChange(seller, checked)}
                    />
                    <Label htmlFor={`seller-${seller}`} className="text-sm">
                      {seller}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
