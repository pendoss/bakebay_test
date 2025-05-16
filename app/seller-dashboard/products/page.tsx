"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { EllipsisVertical, Plus, Star } from "lucide-react"
import { fetchProducts } from "@/app/actions/fetchProducts"
import { ProductEditDialog } from "@/components/product-edit-dialog"

// Define interface for product objects
interface Product {
  id: number;
  name: string;
  price: number;
  inventory: number;
  category: string;
  image: string;
  status: string;
  rating: number;
  sales: number;
}

// Пример данных для резервного отображения
const exampleProducts: Product[] = [
  {
    id: 1,
    name: "Шоколадный торт",
    price: 24.99,
    inventory: 15,
    category: "Торты",
    image: "/placeholder.svg?height=200&width=200",
    status: "Активен",
    rating: 4.8,
    sales: 32,
  },
  {
    id: 2,
    name: "Клубничный чизкейк",
    price: 22.99,
    inventory: 8,
    category: "Торты",
    image: "/placeholder.svg?height=200&width=200",
    status: "Активен",
    rating: 4.7,
    sales: 24,
  },
  {
    id: 3,
    name: "Ассорти макарон",
    price: 18.99,
    inventory: 20,
    category: "Печенье",
    image: "/placeholder.svg?height=200&width=200",
    status: "Активен",
    rating: 4.9,
    sales: 21,
  },
  {
    id: 4,
    name: "Булочки с корицей",
    price: 16.99,
    inventory: 12,
    category: "Выпечка",
    image: "/placeholder.svg?height=200&width=200",
    status: "Активен",
    rating: 4.6,
    sales: 18,
  },
  {
    id: 5,
    name: "Тирамису в стаканчике",
    price: 8.99,
    inventory: 6,
    category: "Итальянские десерты",
    image: "/placeholder.svg?height=200&width=200",
    status: "Мало на складе",
    rating: 4.7,
    sales: 15,
  },
  {
    id: 6,
    name: "Капкейки Красный бархат",
    price: 15.99,
    inventory: 0,
    category: "Капкейки",
    image: "/placeholder.svg?height=200&width=200",
    status: "Нет в наличии",
    rating: 4.8,
    sales: 0,
  },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      try {
        setIsLoading(true);
        // Use the server action to fetch products
        const result = await fetchProducts();

        if (result.error) {
          setError(result.error);
          // Use example products as fallback
          setProducts(exampleProducts);
        } else {
          setProducts(result.products);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
        // Use example products as fallback
        setProducts(exampleProducts);
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, []);


  // Filter products based on search term, status, and category
  const filteredProducts: Product[] = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && product.status === "Активен") ||
                         (statusFilter === "low" && product.status === "Мало на складе") ||
                         (statusFilter === "out" && product.status === "Нет в наличии");
    const matchesCategory = categoryFilter === "all" || 
                           product.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Sort products based on sort order
  const sortedProducts: Product[] = [...filteredProducts].sort((a, b) => {
    switch(sortOrder) {
      case "newest": return b.id - a.id;
      case "oldest": return a.id - b.id;
      case "price-asc": return a.price - b.price;
      case "price-desc": return b.price - a.price;
      case "sales": return b.sales - a.sales;
      default: return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Товары</h2>
          <p className="text-muted-foreground">Управляйте своими товарами, запасами и списками</p>
        </div>
        <Link href="/seller-dashboard/products/new">
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Добавить товар
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-20 mb-4 bg-muted/20 rounded-md">
          <p className="text-muted-foreground">Загрузка товаров...</p>
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center h-20 mb-4 bg-destructive/10 rounded-md">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="grid gap-2 w-full sm:max-w-[360px]">
          <Input 
            placeholder="Поиск товаров..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="low">Мало на складе</SelectItem>
              <SelectItem value="out">Нет в наличии</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              <SelectItem value="Торты">Торты</SelectItem>
              <SelectItem value="Печенье">Печенье</SelectItem>
              <SelectItem value="Выпечка">Выпечка</SelectItem>
              <SelectItem value="Итальянские десерты">Итальянские десерты</SelectItem>
              <SelectItem value="Шоколад">Шоколад</SelectItem>
              <SelectItem value="Капкейки">Капкейки</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Новые</SelectItem>
              <SelectItem value="oldest">Старые</SelectItem>
              <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
              <SelectItem value="price-desc">Цена: по убыванию</SelectItem>
              <SelectItem value="sales">Самые продаваемые</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="grid" className="flex-1 sm:flex-auto">
            Сетка
          </TabsTrigger>
          <TabsTrigger value="list" className="flex-1 sm:flex-auto">
            Список
          </TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="mt-4">
          {!isLoading && sortedProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 bg-muted/10 rounded-md mb-4">
              <p className="text-muted-foreground mb-2">Нет товаров для отображения</p>
              <Link href="/seller-dashboard/products/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить товар
                </Button>
              </Link>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white">
                          <EllipsisVertical className="h-4 w-4" />
                          <span className="sr-only">Действия</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Действия</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setEditingProductId(product.id);
                          setIsEditDialogOpen(true);
                        }}>Редактировать товар</DropdownMenuItem>
                        <DropdownMenuItem>Обновить запасы</DropdownMenuItem>
                        <DropdownMenuItem>Просмотреть отзывы</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Удалить товар</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {product.status !== "Активен" && (
                    <Badge
                      variant={product.status === "Мало на складе" ? "secondary" : "outline"}
                      className="absolute bottom-2 left-2"
                    >
                      {product.status}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-medium">{product.price} руб.</span>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span>{product.rating}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Запасы:</span>
                      <span className={product.inventory === 0 ? "text-destructive" : ""}>{product.inventory} шт.</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Продажи:</span>
                      <span>{product.sales} продано</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Категория:</span>
                      <span>{product.category}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setEditingProductId(product.id);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    Управление товаром
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          {!isLoading && sortedProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 bg-muted/10 rounded-md mb-4">
              <p className="text-muted-foreground mb-2">Нет товаров для отображения</p>
              <Link href="/seller-dashboard/products/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить товар
                </Button>
              </Link>
            </div>
          )}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {sortedProducts.map((product) => (
                  <div key={product.id} className="flex items-center p-4 gap-4">
                    <div className="w-16 h-16 relative flex-shrink-0">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="font-semibold">{product.name}</h3>
                        <Badge
                          variant={
                            product.status === "Активен"
                              ? "default"
                              : product.status === "Мало на складе"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {product.status}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center text-sm gap-2 sm:gap-6 mt-1">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Цена:</span>
                          <span className="font-medium">{product.price} руб.</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Запасы:</span>
                          <span className={product.inventory === 0 ? "text-destructive font-medium" : "font-medium"}>
                            {product.inventory} шт.
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Категория:</span>
                          <span>{product.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          <span>{product.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <EllipsisVertical className="h-4 w-4" />
                            <span className="sr-only">Действия</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Действия</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setEditingProductId(product.id);
                            setIsEditDialogOpen(true);
                          }}>Редактировать товар</DropdownMenuItem>
                          <DropdownMenuItem>Обновить запасы</DropdownMenuItem>
                          <DropdownMenuItem>Просмотреть отзывы</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Удалить товар</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Edit Dialog */}
      <ProductEditDialog 
        productId={editingProductId} 
        isOpen={isEditDialogOpen} 
        onOpenChangeAction={setIsEditDialogOpen}
      />
    </div>
  )
}
