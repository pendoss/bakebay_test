"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Package, List, CheckCircle } from "lucide-react"
import { NextRequest, NextResponse } from 'next/server';
import { userMiddleware, AuthenticatedRequest, isAuthenticated, isAdmin } from '@/app/api/middleware/user';


interface Ingredient {
  name: string;
  amount: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  ingredients: Ingredient[];
}

interface Order {
  id: string;
  customer: string;
  status: string;
  items: OrderItem[];
}

interface IngredientDetail {
  amounts: string[];
  orders: Set<string>;
}

interface AllIngredientsType {
  [key: string]: IngredientDetail;
}

interface CheckedIngredientsType {
  [key: string]: boolean;
}

// Пример данных для заказов с ингредиентами
const orders: Order[] = [
  {
    id: "ЗКЗ-7652",
    customer: "София Тейлор",
    status: "В обработке",
    items: [
      {
        name: "Шоколадный торт",
        quantity: 1,
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
      },
      {
        name: "Ассорти макарон",
        quantity: 2,
        ingredients: [
          { name: "Миндальная мука", amount: "200г" },
          { name: "Сахарная пудра", amount: "200г" },
          { name: "Яичные белки", amount: "100г" },
          { name: "Гранулированный сахар", amount: "100г" },
          { name: "Пищевой краситель", amount: "разные" },
          { name: "Масло", amount: "150г" },
          { name: "Ванильный экстракт", amount: "5мл" },
        ],
      },
    ],
  },
  {
    id: "ЗКЗ-7651",
    customer: "Джеймс Уилсон",
    status: "В обработке",
    items: [
      {
        name: "Клубничный чизкейк",
        quantity: 1,
        ingredients: [
          { name: "Печенье Грэхем", amount: "200г" },
          { name: "Масло", amount: "100г" },
          { name: "Сливочный сыр", amount: "500г" },
          { name: "Сахар", amount: "150г" },
          { name: "Яйца", amount: "3" },
          { name: "Ванильный экстракт", amount: "10мл" },
          { name: "Свежая клубника", amount: "300г" },
          { name: "Клубничный джем", amount: "100г" },
        ],
      },
    ],
  },
  {
    id: "ЗКЗ-7650",
    customer: "Эмма Джонсон",
    status: "Отправлен",
    items: [
      {
        name: "Тирамису в стаканчике",
        quantity: 2,
        ingredients: [
          { name: "Сыр маскарпоне", amount: "250г" },
          { name: "Яйца", amount: "2" },
          { name: "Сахар", amount: "100г" },
          { name: "Печенье савоярди", amount: "100г" },
          { name: "Эспрессо", amount: "120мл" },
          { name: "Какао-порошок", amount: "20г" },
          { name: "Ром", amount: "30мл" },
        ],
      },
      {
        name: "Булочки с корицей",
        quantity: 1,
        ingredients: [
          { name: "Мука общего назначения", amount: "500г" },
          { name: "Масло", amount: "100г" },
          { name: "Молоко", amount: "240мл" },
          { name: "Сахар", amount: "150г" },
          { name: "Корица", amount: "30г" },
          { name: "Дрожжи", amount: "10г" },
          { name: "Яйца", amount: "1" },
          { name: "Сливочный сыр", amount: "100г" },
          { name: "Сахарная пудра", amount: "150г" },
        ],
      },
    ],
  },
]


async function handler(req: AuthenticatedRequest): Promise<NextResponse>{
  if (!isAuthenticated(req)) {
    return NextResponse.json(
      {error: 'Ошибка прав доступа'},
      { status : 401}
    )
  }

  const user = req.user;

  if (req.method === 'POST' && !isAdmin(req)){
    return NextResponse.json(
      { error: 'Требуются права администратора'},
      { status: 401}
    )
  }
  return NextResponse.json({error: "Нет разререшен"}, {status: 401})
}

export default function IngredientsPage() {
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [allIngredients, setAllIngredients] = useState<AllIngredientsType>({})
  const [checkedIngredients, setCheckedIngredients] = useState<CheckedIngredientsType>({})
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Фильтруем только заказы в обработке
    const processingOrders = orders.filter((order) => order.status === "В обработке")
    setActiveOrders(processingOrders)

    // Рассчитываем все необходимые ингредиенты
    const ingredients: AllIngredientsType = {}

    processingOrders.forEach((order) => {
      order.items.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          item.ingredients.forEach((ingredient) => {
            if (!ingredients[ingredient.name]) {
              ingredients[ingredient.name] = {
                amounts: [],
                orders: new Set(),
              }
            }
            ingredients[ingredient.name].amounts.push(ingredient.amount)
            ingredients[ingredient.name].orders.add(order.id)
          })
        }
      })
    })

    setAllIngredients(ingredients)

    // Инициализируем состояние проверки для всех ингредиентов
    const initialCheckedState: CheckedIngredientsType = {}
    Object.keys(ingredients).forEach((ingredient) => {
      initialCheckedState[ingredient] = false
    })
    setCheckedIngredients(initialCheckedState)
  }, [])

  const toggleIngredientCheck = (ingredient: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [ingredient]: !prev[ingredient],
    }))
  }

  const filteredIngredients: string[] = Object.keys(allIngredients)
    .filter((name) => name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort()

  const getCompletionPercentage = (): number => {
    const total = Object.keys(checkedIngredients).length
    if (total === 0) return 0
    const checked = Object.values(checkedIngredients).filter(Boolean).length
    return Math.round((checked / total) * 100)
  }

  return (
    
    <div className="space-y-6">
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Управление ингредиентами</h2>
        <p className="text-muted-foreground">Отслеживайте ингредиенты, необходимые для ваших ожидающих заказов</p>
      </div>
      {/* {localStorage.getItem('auth') ? ( */}
      <Tabs defaultValue="shopping-list" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="shopping-list" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Список покупок
          </TabsTrigger>
          <TabsTrigger value="by-order" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            По заказам
          </TabsTrigger>
          <TabsTrigger value="all-ingredients" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Все ингредиенты
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shopping-list" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Список покупок</CardTitle>
                  <CardDescription>Все ингредиенты, необходимые для ожидающих заказов</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">Выполнено: {getCompletionPercentage()}%</div>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${getCompletionPercentage()}%` }} />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Поиск ингредиентов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex justify-between mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newState: CheckedIngredientsType = {}
                    Object.keys(checkedIngredients).forEach((key) => {
                      newState[key] = true
                    })
                    setCheckedIngredients(newState)
                  }}
                >
                  Отметить все
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newState: CheckedIngredientsType = {}
                    Object.keys(checkedIngredients).forEach((key) => {
                      newState[key] = false
                    })
                    setCheckedIngredients(newState)
                  }}
                >
                  Снять все отметки
                </Button>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {filteredIngredients.map((ingredient) => (
                    <div
                      key={ingredient}
                      className={`flex items-start p-3 rounded-lg border ${
                        checkedIngredients[ingredient] ? "bg-muted/50 border-muted" : "bg-card"
                      }`}
                    >
                      <Checkbox
                        id={`check-${ingredient}`}
                        checked={checkedIngredients[ingredient]}
                        onCheckedChange={() => toggleIngredientCheck(ingredient)}
                        className="mt-1"
                      />
                      <div className="ml-3 flex-1">
                        <Label
                          htmlFor={`check-${ingredient}`}
                          className={`font-medium ${checkedIngredients[ingredient] ? "line-through text-muted-foreground" : ""}`}
                        >
                          {ingredient}
                        </Label>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span>Необходимо для {allIngredients[ingredient]?.orders.size || 0} заказов</span>
                          <div className="mt-1">
                            {allIngredients[ingredient]?.amounts.map((amount, i) => (
                              <Badge key={i} variant="outline" className="mr-1 mb-1">
                                {amount}
                              </Badge>
                            )) || []}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredIngredients.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Ингредиенты не соответствуют вашему поиску
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-order" className="mt-4 space-y-4">
          {activeOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle>{order.id}</CardTitle>
                    <CardDescription>Клиент: {order.customer}</CardDescription>
                  </div>
                  <Badge>{order.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h4 className="font-medium mb-2">
                        {item.name} × {item.quantity}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                        {item.ingredients.map((ingredient, ingredientIndex) => (
                          <div key={ingredientIndex} className="flex items-center p-2 rounded-md border bg-muted/30">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{ingredient.name}</div>
                              <div className="text-xs text-muted-foreground">{ingredient.amount}</div>
                            </div>
                            <Checkbox
                              checked={checkedIngredients[ingredient.name] ?? false}
                              onCheckedChange={() => toggleIngredientCheck(ingredient.name)}
                            />
                          </div>
                        ))}
                      </div>
                      {itemIndex < order.items.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {activeOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <CheckCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Нет активных заказов</h3>
              <p className="text-muted-foreground mt-1">Все текущие заказы обработаны</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-ingredients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Инвентарь ингредиентов</CardTitle>
              <CardDescription>Управляйте запасами ингредиентов и настройте оповещения о низком запасе</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input placeholder="Поиск ингредиентов..." />
              </div>

              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
                  <div className="col-span-5">Ингредиент</div>
                  <div className="col-span-2">В наличии</div>
                  <div className="col-span-2">Единица</div>
                  <div className="col-span-2">Уровень оповещения</div>
                  <div className="col-span-1">Статус</div>
                </div>

                <div className="divide-y">
                  {[
                    { name: "Мука общего назначения", stock: 5, unit: "кг", alert: 2, status: "ok" },
                    { name: "Миндальная мука", stock: 1.2, unit: "кг", alert: 1, status: "low" },
                    { name: "Масло", stock: 3, unit: "кг", alert: 1, status: "ok" },
                    { name: "Какао-порошок", stock: 0.5, unit: "кг", alert: 1, status: "low" },
                    { name: "Сливочный сыр", stock: 2, unit: "кг", alert: 1, status: "ok" },
                    { name: "Темный шоколад", stock: 0.2, unit: "кг", alert: 0.5, status: "low" },
                    { name: "Яйца", stock: 24, unit: "шт", alert: 12, status: "ok" },
                    { name: "Свежая клубника", stock: 0, unit: "кг", alert: 1, status: "out" },
                    { name: "Молоко", stock: 4, unit: "л", alert: 2, status: "ok" },
                    { name: "Сахар", stock: 7, unit: "кг", alert: 3, status: "ok" },
                    { name: "Ванильный экстракт", stock: 0.3, unit: "л", alert: 0.1, status: "ok" },
                  ].map((ingredient, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center">
                      <div className="col-span-5 font-medium">{ingredient.name}</div>
                      <div className="col-span-2">{ingredient.stock}</div>
                      <div className="col-span-2">{ingredient.unit}</div>
                      <div className="col-span-2">{ingredient.alert}</div>
                      <div className="col-span-1">
                        {ingredient.status === "ok" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            OK
                          </Badge>
                        )}
                        {ingredient.status === "low" && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Мало
                          </Badge>
                        )}
                        {ingredient.status === "out" && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Нет
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <Button variant="outline">Экспорт инвентаря</Button>
                <Button>Добавить ингредиент</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* ) :(
        <p> Чтобы получить доступ к разделу, нужно стать продавцом</p>
      )} */}
    </div>
  )
}
