"use client"

import { useState, useRef, FormEvent, ChangeEvent, DragEvent } from "react"
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
import { X, Plus, Trash2, GripVertical, ImagePlus } from "lucide-react"
import { createProduct } from "@/app/actions/product"

// Define interfaces for the product page
interface ProductImage {
  url: string;
  file: File;
  name: string;
}

interface ProductIngredient {
  name: string;
  amount: string;
  unit: string;
}

interface Product {
  name: string;
  description: string;
  category: string;
  status: string;
  price: number;
  cost: number;
  inventory: number;
  sku: string;
  weight: number;
  size: string;
  storageInstructions: string;
  shelfLife: number;
  trackInventory: boolean;
  lowStockAlert: boolean;
  dietaryInfo: string[];
  images: ProductImage[];
  ingredients: ProductIngredient[];
}

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [images, setImages] = useState<ProductImage[]>([])
  const [ingredients, setIngredients] = useState<ProductIngredient[]>([])
  const [newIngredient, setNewIngredient] = useState<ProductIngredient>({ name: "", amount: "", unit: "" })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize form state with default values
  const [formState, setFormState] = useState<Partial<Product>>({
    name: "",
    description: "",
    category: "",
    status: "active",
    price: 0,
    cost: 0,
    inventory: 0,
    sku: "",
    weight: 0,
    size: "",
    storageInstructions: "",
    shelfLife: 0,
    trackInventory: true,
    lowStockAlert: false,
    dietaryInfo: [],
    images: [],
    ingredients: []
  })

  // Handle form input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { id, value } = e.target;
    setFormState((prev: Partial<Product>) => ({
      ...prev,
      [id]: value
    }));
  }

  // Handle select changes
  const handleSelectChange = (id: string, value: string): void => {
    setFormState((prev: Partial<Product>) => ({
      ...prev,
      [id]: value
    }));
  }

  // Handle checkbox changes
  const handleCheckboxChange = (id: string, checked: boolean): void => {
    setFormState((prev: Partial<Product>) => ({
      ...prev,
      [id]: checked
    }));
  }

  // Handle dietary info changes
  const handleDietaryInfoChange = (option: string, checked: boolean): void => {
    setFormState((prev: Partial<Product>) => {
      const dietaryInfo: string[] = [...(prev.dietaryInfo || [])];

      if (checked && !dietaryInfo.includes(option)) {
        dietaryInfo.push(option);
      } else if (!checked && dietaryInfo.includes(option)) {
        const index = dietaryInfo.indexOf(option);
        dietaryInfo.splice(index, 1);
      }

      return {
        ...prev,
        dietaryInfo
      };
    });
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    console.log(e);
    e.preventDefault()
    setIsSubmitting(true)

    // Update form state with current images and ingredients
    // Include the file property for server-side processing
    const serverImages = images.map(image => ({
      url: image.url,
      name: image.name,
      file: image.file
    }));

    const updatedFormState: Partial<Product> = {
      ...formState,
      images: serverImages,
      ingredients
    };

    // Form validation
    if (!updatedFormState.name || !updatedFormState.description || !updatedFormState.category) {
      toast({
        title: "Ошибка валидации",
        description: "Пожалуйста, заполните все обязательные поля.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Use the server action to create the product
      const result = await createProduct(updatedFormState);

      if (result.success) {
        toast({
          title: "Товар создан",
          description: "Ваш товар был успешно создан.",
        });

        router.push("/seller-dashboard/products");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании товара. Пожалуйста, попробуйте снова.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files
    if (files && files.length > 0) {
      addImageFiles(Array.from(files))
    }
  }

  const addImageFiles = (files: File[]): void => {
    const newImages: ProductImage[] = [...images]

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const imageUrl = URL.createObjectURL(file)
        newImages.push({
          url: imageUrl,
          file: file,
          name: file.name,
        })
      }
    })

    setImages(newImages)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (): void => {
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addImageFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleRemoveImage = (index: number): void => {
    const newImages: ProductImage[] = [...images]

    // If the image has a URL.createObjectURL, free up memory
    if (newImages[index].url && newImages[index].url.startsWith("blob:")) {
      URL.revokeObjectURL(newImages[index].url)
    }

    newImages.splice(index, 1)
    setImages(newImages)
  }

  const handleDragStart = (index: number): void => {
    setDraggedImageIndex(index)
  }

  const handleDragEnter = (index: number): void => {
    if (draggedImageIndex === null || draggedImageIndex === index) return

    const newImages: ProductImage[] = [...images]
    const draggedImage = newImages[draggedImageIndex]

    // Remove image from current position
    newImages.splice(draggedImageIndex, 1)
    // Insert at new position
    newImages.splice(index, 0, draggedImage)

    setImages(newImages)
    setDraggedImageIndex(index)
  }

  const handleDragEnd = (): void => {
    setDraggedImageIndex(null)
  }

  const handleAddIngredient = (): void => {
    if (!newIngredient.name || !newIngredient.amount || !newIngredient.unit) return

    setIngredients([...ingredients, { ...newIngredient }])
    setNewIngredient({ name: "", amount: "", unit: "" })
  }

  const handleRemoveIngredient = (index: number): void => {
    const newIngredients: ProductIngredient[] = [...ingredients]
    newIngredients.splice(index, 1)
    setIngredients(newIngredients)
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
                    <Label htmlFor="name">Название товара</Label>
                    <Input 
                      id="name" 
                      placeholder="Введите название товара" 
                      value={formState.name}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Опишите ваш товар" 
                      className="min-h-[120px]" 
                      value={formState.description}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Категория</Label>
                      <Select 
                        value={formState.category} 
                        onValueChange={(value) => handleSelectChange("category", value)}
                        required
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cakes">Торты</SelectItem>
                          <SelectItem value="Cookies">Печенье</SelectItem>
                          <SelectItem value="Castries">Выпечка</SelectItem>
                          <SelectItem value="Ctalian-desserts">Итальянские десерты</SelectItem>
                          <SelectItem value="Chocolates">Шоколад</SelectItem>
                          <SelectItem value="Cupcakes">Капкейки</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Статус</Label>
                      <Select 
                        value={formState.status} 
                        onValueChange={(value) => handleSelectChange("status", value)}
                        required
                      >
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
                  <div className="space-y-4">
                    <div className="rounded-md border">
                      <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
                        <div className="col-span-5">Ингредиент</div>
                        <div className="col-span-3">Количество</div>
                        <div className="col-span-3">Единица измерения</div>
                        <div className="col-span-1"></div>
                      </div>

                      <div className="divide-y">
                        {ingredients.map((ingredient, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 p-4 items-center">
                              <div className="col-span-5">{ingredient.name}</div>
                              <div className="col-span-3">{ingredient.amount}</div>
                              <div className="col-span-3">{ingredient.unit}</div>
                              <div className="col-span-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    type="button"
                                    onClick={() => handleRemoveIngredient(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Remove</span>
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
                            placeholder="например, 250"
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="ingredientUnit">Единица измерения</Label>
                        <Select
                            value={newIngredient.unit}
                            onValueChange={(value) => setNewIngredient({ ...newIngredient, unit: value })}
                        >
                          <SelectTrigger id="ingredientUnit">
                            <SelectValue placeholder="Выберите" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="г">г</SelectItem>
                            <SelectItem value="кг">кг</SelectItem>
                            <SelectItem value="мл">мл</SelectItem>
                            <SelectItem value="л">л</SelectItem>
                            <SelectItem value="шт">шт</SelectItem>
                            <SelectItem value="ч.л.">ч.л.</SelectItem>
                            <SelectItem value="ст.л.">ст.л.</SelectItem>
                            <SelectItem value="стакан">стакан</SelectItem>
                          </SelectContent>
                        </Select>
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
                      Добавление ингредиентов помогает отслеживать, что вам нужно для каждого заказа, и эффективно управлять запасами.
                    </div>
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
                            <Checkbox 
                              id={`diet-${option}`} 
                              checked={(formState.dietaryInfo || []).includes(option)}
                              onCheckedChange={(checked) => handleDietaryInfoChange(option, checked === true)}
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
                        placeholder="например, 250" 
                        value={formState.weight || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const value = parseInt(e.target.value);
                          handleInputChange({
                            ...e,
                            target: {
                              ...e.target,
                              id: e.target.id,
                              value: isNaN(value) ? '' : value
                            }
                          } as ChangeEvent<HTMLInputElement>);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size">Размер</Label>
                      <Select
                        value={formState.size || ''}
                        onValueChange={(value) => handleSelectChange("size", value)}
                      >
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
                    <Label htmlFor="storageInstructions">Инструкции по хранению</Label>
                    <Input 
                      id="storageInstructions" 
                      placeholder="например, Хранить в холодильнике" 
                      value={formState.storageInstructions || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shelfLife">Срок годности (дни)</Label>
                    <Input 
                      id="shelfLife" 
                      type="number" 
                      min="1" 
                      placeholder="например, 5" 
                      value={formState.shelfLife || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const value = parseInt(e.target.value);
                        handleInputChange({
                          ...e,
                          target: {
                            ...e.target,
                            id: e.target.id,
                            value: isNaN(value) ? '' : value
                          }
                        } as ChangeEvent<HTMLInputElement>);
                      }}
                    />
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
                        placeholder="например, 1999" 
                        value={formState.price || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const value = parseFloat(e.target.value);
                          handleInputChange({
                            ...e,
                            target: {
                              ...e.target,
                              id: e.target.id,
                              value: isNaN(value) ? '' : value
                            }
                          } as ChangeEvent<HTMLInputElement>);
                        }}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profit">Прибыль</Label>
                      <Input 
                        id="profit" 
                        disabled 
                        placeholder={`₽${formState.price && formState.cost ? (formState.price - formState.cost).toFixed(2) : '0.00'}`} 
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
                        placeholder="например, 850" 
                        value={formState.cost || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const value = parseFloat(e.target.value);
                          handleInputChange({
                            ...e,
                            target: {
                              ...e.target,
                              id: e.target.id,
                              value: isNaN(value) ? '' : value
                            }
                          } as ChangeEvent<HTMLInputElement>);
                        }}
                      />
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
                        placeholder="например, 25" 
                        value={formState.inventory || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const value = parseInt(e.target.value);
                          handleInputChange({
                            ...e,
                            target: {
                              ...e.target,
                              id: e.target.id,
                              value: isNaN(value) ? '' : value
                            }
                          } as ChangeEvent<HTMLInputElement>);
                        }}
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sku">Артикул (SKU)</Label>
                      <Input 
                        id="sku" 
                        placeholder="например, ТОРТ-ШОК-001" 
                        value={formState.sku || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="trackInventory" 
                        checked={formState.trackInventory}
                        onCheckedChange={(checked) => handleCheckboxChange("trackInventory", checked === true)}
                      />
                      <Label htmlFor="trackInventory">Отслеживать запасы</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="lowStockAlert" 
                        checked={formState.lowStockAlert}
                        onCheckedChange={(checked) => handleCheckboxChange("lowStockAlert", checked === true)}
                      />
                      <Label htmlFor="lowStockAlert">Уведомлять по email, когда запасы заканчиваются</Label>
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
                  <div
                      className={`border-2 border-dashed rounded-lg p-6 mb-6 transition-colors ${
                          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      <ImagePlus className="h-10 w-10 text-muted-foreground" />
                      <h3 className="font-medium">Перетащите изображения сюда</h3>
                      <p className="text-sm text-muted-foreground mb-2">или нажмите кнопку ниже для выбора файлов</p>
                      <input
                          name="images"
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                      />
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Выбрать изображения
                      </Button>
                    </div>
                  </div>

                  {images.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Загруженные изображения</h3>
                          <p className="text-sm text-muted-foreground">Перетаскивайте изображения для изменения порядка</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {images.map((image, index) => (
                              <div
                                  key={index}
                                  className={`relative border rounded-lg overflow-hidden group ${
                                      draggedImageIndex === index ? "opacity-50" : ""
                                  }`}
                                  draggable
                                  onDragStart={() => handleDragStart(index)}
                                  onDragEnter={() => handleDragEnter(index)}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={(e) => e.preventDefault()}
                              >
                                <div className="aspect-square relative">
                                  <Image
                                      src={image.url || "/placeholder.svg?height=300&width=300"}
                                      alt={image.name || `Изображение товара ${index + 1}`}
                                      fill
                                      className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="absolute top-2 right-2 flex gap-1">
                                      <button
                                          type="button"
                                          onClick={() => handleRemoveImage(index)}
                                          className="bg-white rounded-full p-1 shadow-sm hover:bg-red-50"
                                      >
                                        <X className="h-4 w-4 text-red-500" />
                                        <span className="sr-only">Удалить изображение</span>
                                      </button>
                                    </div>
                                    <div className="absolute top-2 left-2">
                                      <GripVertical className="h-5 w-5 text-white drop-shadow-md cursor-move" />
                                    </div>
                                  </div>
                                </div>
                                {index === 0 && (
                                    <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded shadow-sm">
                                      Главное изображение
                                    </div>
                                )}
                                <div className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
                                  {index + 1} / {images.length}
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                  )}
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
