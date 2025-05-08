"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ShoppingCart, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/cart-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

// Словарь для перевода диетических опций
const dietaryTranslations: { [key: string]: string } = {
  "Gluten-Free": "Без глютена",
  Vegan: "Веганское",
  "Dairy-Free": "Без молочных продуктов",
  "Contains Nuts": "Содержит орехи",
  "Contains Gluten": "Содержит глютен",
  "Contains Dairy": "Содержит молочные продукты",
  "May Contain Nuts": "Может содержать орехи",
}

type Product = {
    id: number
    name: string
    description: string
    price: number
    image?: string
    category: string
    dietary: string[]
    rating: number
    seller: string
}

export function ProductCard({ product } : {product : Product}) {
  const { toast } = useToast()
  const { addItem } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation() // Предотвращаем открытие модального окна при нажатии на кнопку добавления в корзину

    // Добавляем товар в корзину
    addItem(product)

    toast({
      title: "Добавлено в корзину",
      description: `${product.name} добавлен в вашу корзину.`,
    })
  }

  return (
    <>
      <Card
        className="overflow-hidden transition-all duration-200 hover:shadow-md group relative"
        onClick={() => setIsOpen(true)}
      >
        <div className="aspect-square relative">
          <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          <Button
            size="sm"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Добавить
          </Button>
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
            <Badge variant="outline" className="ml-2 shrink-0">
              {product.category}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{product.description}</p>
          <div className="flex items-center gap-1 text-sm mb-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span>{product.rating}</span>
          </div>
          <p className="text-sm text-muted-foreground">Продавец: {product.seller}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="font-semibold">${product.price.toFixed(2)}</div>
          <div className="flex flex-wrap gap-1">
            {product.dietary.slice(0, 2).map((diet, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {dietaryTranslations[diet] || diet}
              </Badge>
            ))}
            {product.dietary.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{product.dietary.length - 2}
              </Badge>
            )}
          </div>
        </CardFooter>
      </Card>

      <ProductDetailDialog product={product} isOpen={isOpen} setIsOpen={setIsOpen} onAddToCart={handleAddToCart} />
    </>
  )
}


interface ProductDetailDialogProps {
    product: Product
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
    onAddToCart: (e: React.MouseEvent) => void
}
function ProductDetailDialog({ product, isOpen, setIsOpen, onAddToCart } : ProductDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden">
        <DialogClose className="absolute right-4 top-4 z-10">
          <X className="h-4 w-4" />
          <span className="sr-only">Закрыть</span>
        </DialogClose>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative aspect-square md:aspect-auto">
            <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          </div>

          <div className="p-6 overflow-y-auto max-h-[80vh]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl">{product.name}</DialogTitle>
                  <DialogDescription className="text-sm">Продавец: {product.seller}</DialogDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <span className="font-medium">{product.rating}</span>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-6">
              <div className="text-2xl font-bold mb-4">${product.price.toFixed(2)}</div>

              <p className="text-muted-foreground mb-6">{product.description}</p>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Диетическая информация</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.dietary.map((diet, index) => (
                      <Badge key={index} variant="secondary">
                        {dietaryTranslations[diet] || diet}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Размер</h4>
                  <RadioGroup defaultValue="regular">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="small" id="size-small" />
                        <Label htmlFor="size-small">Маленький</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="regular" id="size-regular" />
                        <Label htmlFor="size-regular">Стандартный</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="large" id="size-large" />
                        <Label htmlFor="size-large">Большой</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Детали</TabsTrigger>
                  <TabsTrigger value="ingredients">Ингредиенты</TabsTrigger>
                  <TabsTrigger value="reviews">Отзывы</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <p>
                    {product.name} - это вкусное лакомство, приготовленное из лучших ингредиентов. Идеально подходит для
                    любого случая, это сладкое удовольствие удовлетворит ваши желания.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Категория:</span>
                      <span className="font-medium">{product.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Срок годности:</span>
                      <span className="font-medium">3-5 дней</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Хранение:</span>
                      <span className="font-medium">Охлажденное</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Произведено в:</span>
                      <span className="font-medium">России</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ingredients" className="space-y-4 mt-4">
                  <p className="text-sm">
                    Ингредиенты могут включать: муку, сахар, масло, яйца, молоко, экстракт ванили и другие натуральные
                    ароматизаторы.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Информация об аллергенах: Может содержать пшеницу, молочные продукты, яйца и орехи. Производится на
                    предприятии, где обрабатываются орехи.
                  </p>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {[
                      { name: "Мария С.", rating: 5, comment: "Абсолютно восхитительно! Обязательно закажу снова." },
                      { name: "Михаил Т.", rating: 4, comment: "Отличный вкус и текстура. Прибыл свежим." },
                      { name: "Юлия Р.", rating: 5, comment: "Идеальный уровень сладости и красивое оформление." },
                    ].map((review, index) => (
                      <div key={index} className="border-b pb-4 last:border-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{review.name}</span>
                          <div className="flex">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "fill-muted text-muted-foreground"}`}
                                />
                              ))}
                          </div>
                        </div>
                        <p className="text-sm mt-1">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-8 flex gap-4">
                <Button className="flex-1" onClick={onAddToCart}>
                  <ShoppingCart className="h-4 w-4 mr-2" />В корзину
                </Button>
                <Button variant="outline" className="flex-1">
                  Купить сейчас
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
