"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Upload, X } from "lucide-react"

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState(["/placeholder.svg?height=300&width=300"])

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Имитация отправки формы
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Товар создан",
        description: "Ваш товар был успешно создан.",
      })
      router.push("/seller-dashboard/products")
    }, 1500)
  }

  const handleAddImage = () => {
    setImages([...images, "/placeholder.svg?height=300&width=300"])
  }

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Добавить новый товар</h2>
        <p className="text-muted-foreground">Создайте новый товар для размещения в вашем магазине</p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
          <TabsTrigger value="basic" className="flex-1 sm:flex-auto">
            Основная информация
          </TabsTrigger>
          <TabsTrigger value="details" className="flex-1 sm:flex-auto">
            Детали
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex-1 sm:flex-auto">
            Цены
          </TabsTrigger>
          <TabsTrigger value="images" className="flex-1 sm:flex-auto">
            Изображения
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="basic" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Название товара</Label>
                  <Input id="productName" placeholder="Введите название товара" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea id="description" placeholder="Опишите ваш товар" className="min-h-[120px]" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Категория</Label>
                    <Select required>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cakes">Торты</SelectItem>
                        <SelectItem value="cookies">Печенье</SelectItem>
                        <SelectItem value="pastries">Выпечка</SelectItem>
                        <SelectItem value="italian-desserts">Итальянские десерты</SelectItem>
                        <SelectItem value="chocolates">Шоколад</SelectItem>
                        <SelectItem value="cupcakes">Капкейки</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Статус</Label>
                    <Select defaultValue="active" required>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Активен</SelectItem>
                        <SelectItem value="draft">Черновик</SelectItem>
                        <SelectItem value="hidden">Скрыт</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Детали товара</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ingredients">Ингредиенты</Label>
                  <Textarea id="ingredients" placeholder="Перечислите все ингредиенты" className="min-h-[120px]" />
                </div>

                <div className="space-y-2">
                  <Label>Диетическая информация</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      "Без глютена",
                      "Веганское",
                      "Без молочных продуктов",
                      "Содержит орехи",
                      "Содержит глютен",
                      "Содержит молочные продукты",
                      "Может содержать орехи",
                    ].map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox id={`diet-${option}`} />
                        <Label htmlFor={`diet-${option}`} className="text-sm font-normal">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Вес (граммы)</Label>
                    <Input id="weight" type="number" min="0" placeholder="например, 250" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Размер</Label>
                    <Select>
                      <SelectTrigger id="size">
                        <SelectValue placeholder="Выберите размер" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Маленький</SelectItem>
                        <SelectItem value="medium">Средний</SelectItem>
                        <SelectItem value="large">Большой</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage">Инструкции по хранению</Label>
                  <Input id="storage" placeholder="например, Хранить в холодильнике" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shelfLife">Срок годности (дни)</Label>
                  <Input id="shelfLife" type="number" min="1" placeholder="например, 5" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Цены и запасы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Цена (₽)</Label>
                    <Input id="price" type="number" min="0.01" step="0.01" placeholder="например, 1999" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comparePrice">Сравнительная цена (Необязательно)</Label>
                    <Input id="comparePrice" type="number" min="0.01" step="0.01" placeholder="например, 2499" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Себестоимость за единицу (₽)</Label>
                    <Input id="cost" type="number" min="0.01" step="0.01" placeholder="например, 850" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profit">Прибыль</Label>
                    <Input id="profit" disabled placeholder="₽0.00" />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inventory">Количество на складе</Label>
                    <Input id="inventory" type="number" min="0" placeholder="например, 25" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">Артикул (SKU)</Label>
                    <Input id="sku" placeholder="например, ТОРТ-ШОК-001" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="trackInventory" defaultChecked />
                    <Label htmlFor="trackInventory">Отслеживать запасы</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="lowStock" />
                    <Label htmlFor="lowStock">Уведомлять по email, когда запасы заканчиваются</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Изображения товара</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square border rounded-lg overflow-hidden group">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Изображение товара ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Удалить изображение</span>
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Главное изображение
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="aspect-square border rounded-lg border-dashed flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Добавить изображение</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="mt-6 flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push("/seller-dashboard/products")}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Создание..." : "Создать товар"}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}
