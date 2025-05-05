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
import { Upload, X, Plus, Trash2 } from "lucide-react"

// Пример данных о товаре
const product = {
  id: 1,
  name: "Шоколадный торт",
  description: "Насыщенный шоколадный торт с глазурью",
  price: 24.99,
  comparePrice: 29.99,
  cost: 10.5,
  inventory: 15,
  sku: "ТОРТ-ШОК-001",
  category: "Торты",
  status: "Активен",
  weight: 1200,
  size: "Стандартный",
  storage: "Хранить в холодильнике после вскрытия",
  shelfLife: 5,
  ingredients: [
    { name: "Мука общего назначения", amount: "250г" },
    { name: "Какао-порошок", amount: "75г" },
    { name: "Сахар", amount: "300г" },
    { name: "Масло", amount: "200г" },
    { name: "Яйца", amount: "4" },
    { name: "Молоко", amount: "120мл" },
    { name: "Темный шоколад", amount: "150г" },
    { name: "Ванильный экстракт", amount: "5мл" },
  ],
  dietary: ["Содержит глютен", "Содержит молочные продукты"],
  images: ["/placeholder.svg?height=300&width=300", "/placeholder.svg?height=300&width=300"],
}

export default function EditProductPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productData, setProductData] = useState(product)
  const [newIngredient, setNewIngredient] = useState({ name: "", amount: "" })

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Имитация отправки формы
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Товар обновлен",
        description: "Ваш товар был успешно обновлен.",
      })
      router.push("/seller-dashboard/products")
    }, 1500)
  }

  const handleAddImage = () => {
    setProductData({
      ...productData,
      images: [...productData.images, "/placeholder.svg?height=300&width=300"],
    })
  }

  const handleRemoveImage = (index) => {
    const newImages = [...productData.images]
    newImages.splice(index, 1)
    setProductData({
      ...productData,
      images: newImages,
    })
  }

  const handleAddIngredient = () => {
    if (!newIngredient.name || !newIngredient.amount) return

    setProductData({
      ...productData,
      ingredients: [...productData.ingredients, { ...newIngredient }],
    })
    setNewIngredient({ name: "", amount: "" })
  }

  const handleRemoveIngredient = (index) => {
    const newIngredients = [...productData.ingredients]
    newIngredients.splice(index, 1)
    setProductData({
      ...productData,
      ingredients: newIngredients,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Редактировать товар</h2>
        <p className="text-muted-foreground">Обновите информацию о вашем товаре</p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:flex">
          <TabsTrigger value="basic" className="flex-1 sm:flex-auto">
            Основная информация
          </TabsTrigger>
          <TabsTrigger value="details" className="flex-1 sm:flex-auto">
            Детали
          </TabsTrigger>
          <TabsTrigger value="ingredients" className="flex-1 sm:flex-auto">
            Ингредиенты
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
                  <Input
                    id="productName"
                    value={productData.name}
                    onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={productData.description}
                    onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Категория</Label>
                    <Select
                      value={productData.category}
                      onValueChange={(value) => setProductData({ ...productData, category: value })}
                      required
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Торты">Торты</SelectItem>
                        <SelectItem value="Печенье">Печенье</SelectItem>
                        <SelectItem value="Выпечка">Выпечка</SelectItem>
                        <SelectItem value="Итальянские десерты">Итальянские десерты</SelectItem>
                        <SelectItem value="Шоколад">Шоколад</SelectItem>
                        <SelectItem value="Капкейки">Капкейки</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Статус</Label>
                    <Select
                      value={productData.status}
                      onValueChange={(value) => setProductData({ ...productData, status: value })}
                      required
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Активен">Активен</SelectItem>
                        <SelectItem value="Черновик">Черновик</SelectItem>
                        <SelectItem value="Скрыт">Скрыт</SelectItem>
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
                        <Checkbox
                          id={`diet-${option}`}
                          checked={productData.dietary.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setProductData({
                                ...productData,
                                dietary: [...productData.dietary, option],
                              })
                            } else {
                              setProductData({
                                ...productData,
                                dietary: productData.dietary.filter((item) => item !== option),
                              })
                            }
                          }}
                        />
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
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      value={productData.weight}
                      onChange={(e) => setProductData({ ...productData, weight: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Размер</Label>
                    <Select
                      value={productData.size}
                      onValueChange={(value) => setProductData({ ...productData, size: value })}
                    >
                      <SelectTrigger id="size">
                        <SelectValue placeholder="Выберите размер" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Маленький">Маленький</SelectItem>
                        <SelectItem value="Стандартный">Стандартный</SelectItem>
                        <SelectItem value="Большой">Большой</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage">Инструкции по хранению</Label>
                  <Input
                    id="storage"
                    value={productData.storage}
                    onChange={(e) => setProductData({ ...productData, storage: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shelfLife">Срок годности (дни)</Label>
                  <Input
                    id="shelfLife"
                    type="number"
                    min="1"
                    value={productData.shelfLife}
                    onChange={(e) => setProductData({ ...productData, shelfLife: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ingredients" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ингредиенты</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
                      <div className="col-span-6">Ингредиент</div>
                      <div className="col-span-5">Количество</div>
                      <div className="col-span-1"></div>
                    </div>

                    <div className="divide-y">
                      {productData.ingredients.map((ingredient, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 p-4 items-center">
                          <div className="col-span-6">{ingredient.name}</div>
                          <div className="col-span-5">{ingredient.amount}</div>
                          <div className="col-span-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              type="button"
                              onClick={() => handleRemoveIngredient(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Удалить</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 items-end">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="ingredientName">Название ингредиента</Label>
                      <Input
                        id="ingredientName"
                        value={newIngredient.name}
                        onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                        placeholder="например, Мука"
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="ingredientAmount">Количество</Label>
                      <Input
                        id="ingredientAmount"
                        value={newIngredient.amount}
                        onChange={(e) => setNewIngredient({ ...newIngredient, amount: e.target.value })}
                        placeholder="например, 250г"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddIngredient}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Добавить
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Добавление ингредиентов помогает отслеживать, что вам нужно для каждого заказа, и эффективно
                    управлять запасами.
                  </div>
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
                    <Input
                      id="price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={productData.price}
                      onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comparePrice">Сравнительная цена (Необязательно)</Label>
                    <Input
                      id="comparePrice"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={productData.comparePrice}
                      onChange={(e) => setProductData({ ...productData, comparePrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Себестоимость за единицу (₽)</Label>
                    <Input
                      id="cost"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={productData.cost}
                      onChange={(e) => setProductData({ ...productData, cost: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profit">Прибыль</Label>
                    <Input id="profit" disabled value={`₽${(productData.price - productData.cost).toFixed(2)}`} />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inventory">Количество на складе</Label>
                    <Input
                      id="inventory"
                      type="number"
                      min="0"
                      value={productData.inventory}
                      onChange={(e) => setProductData({ ...productData, inventory: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">Артикул (SKU)</Label>
                    <Input
                      id="sku"
                      value={productData.sku}
                      onChange={(e) => setProductData({ ...productData, sku: e.target.value })}
                    />
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
                  {productData.images.map((image, index) => (
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
              {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}
