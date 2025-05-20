"use client"

import { useEffect, useState } from "react";
import { ShoppingCart, Package, List, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { fetchIngredients } from "@/app/actions/fetchIngredients";
import { getOrderDetails, getOrderIds, OrderDetails } from "@/app/actions/getOrders";
import { addIngredient } from "@/app/actions/addIngredient";
import { type } from "os";

export interface Ingredient {
    name: string,
    amount: string,
    stock: number,
    unit: string,
    status: string,
    alert: number
}

export interface OrderItem {
  name: string;
  quantity: number;
  ingredients: Ingredient[];
}

export interface Order {
  id: string;
  status: string;
  items: OrderItem[];
  customer: string;
}

interface IngredientDetail {
  amounts: number[];
  orders: Set<string>;
}

interface AllIngredientsType {
  [key: string]: IngredientDetail;
}

interface CheckedIngredientsType {
  [key: string]: boolean;
}

// // Пример данных для заказов с ингредиентами
// const orders: Order[] = [
//   {
//     id: "ЗКЗ-7652",
//     customer: "София Тейлор",
//     status: "В обработке",
//     items: [
//       {
//         name: "Шоколадный торт",
//         quantity: 1,
//         ingredients: [
//           { name: "Мука общего назначения", amount: "250г" },
//           { name: "Какао-порошок", amount: "75г" },
//           { name: "Сахар", amount: "300г" },
//           { name: "Масло", amount: "200г" },
//           { name: "Яйца", amount: "4" },
//           { name: "Молоко", amount: "120мл" },
//           { name: "Темный шоколад", amount: "150г" },
//           { name: "Ванильный экстракт", amount: "5мл" },
//         ],
//       },
//       {
//         name: "Ассорти макарон",
//         quantity: 2,
//         ingredients: [
//           { name: "Миндальная мука", amount: "200г" },
//           { name: "Сахарная пудра", amount: "200г" },
//           { name: "Яичные белки", amount: "100г" },
//           { name: "Гранулированный сахар", amount: "100г" },
//           { name: "Пищевой краситель", amount: "разные" },
//           { name: "Масло", amount: "150г" },
//           { name: "Ванильный экстракт", amount: "5мл" },
//         ],
//       },
//     ],
//   },
//   {
//     id: "ЗКЗ-7651",
//     customer: "Джеймс Уилсон",
//     status: "В обработке",
//     items: [
//       {
//         name: "Клубничный чизкейк",
//         quantity: 1,
//         ingredients: [
//           { name: "Печенье Грэхем", amount: "200г" },
//           { name: "Масло", amount: "100г" },
//           { name: "Сливочный сыр", amount: "500г" },
//           { name: "Сахар", amount: "150г" },
//           { name: "Яйца", amount: "3" },
//           { name: "Ванильный экстракт", amount: "10мл" },
//           { name: "Свежая клубника", amount: "300г" },
//           { name: "Клубничный джем", amount: "100г" },
//         ],
//       },
//     ],
//   },
//   {
//     id: "ЗКЗ-7650",
//     customer: "Эмма Джонсон",
//     status: "Отправлен",
//     items: [
//       {
//         name: "Тирамису в стаканчике",
//         quantity: 2,
//         ingredients: [
//           { name: "Сыр маскарпоне", amount: "250г" },
//           { name: "Яйца", amount: "2" },
//           { name: "Сахар", amount: "100г" },
//           { name: "Печенье савоярди", amount: "100г" },
//           { name: "Эспрессо", amount: "120мл" },
//           { name: "Какао-порошок", amount: "20г" },
//           { name: "Ром", amount: "30мл" },
//         ],
//       },
//       {
//         name: "Булочки с корицей",
//         quantity: 1,
//         ingredients: [
//           { name: "Мука общего назначения", amount: "500г" },
//           { name: "Масло", amount: "100г" },
//           { name: "Молоко", amount: "240мл" },
//           { name: "Сахар", amount: "150г" },
//           { name: "Корица", amount: "30г" },
//           { name: "Дрожжи", amount: "10г" },
//           { name: "Яйца", amount: "1" },
//           { name: "Сливочный сыр", amount: "100г" },
//           { name: "Сахарная пудра", amount: "150г" },
//         ],
//       },
//     ],
//   },
// ]


// async function handler(req: AuthenticatedRequest): Promise<NextResponse>{
//   if (!isAuthenticated(req)) {
//     return NextResponse.json(
//       {error: 'Ошибка прав доступа'},
//       { status : 401}
//     )
//   }

//   const user = req.user;

//   if (req.method === 'POST' && !isAdmin(req)){
//     return NextResponse.json(
//       { error: 'Требуются права администратора'},
//       { status: 401}
//     )
//   }
//   return NextResponse.json({error: "Нет разререшен"}, {status: 401})
// }

export default function IngredientsPage() {
  const [activeOrders, setActiveOrders] = useState<OrderDetails[]>([])
  const [allIngredients, setAllIngredients] = useState<AllIngredientsType>({})
  const [inventoryIngredients, setInventoryIngredients] = useState<Ingredient[]>([])
  const [checkedIngredients, setCheckedIngredients] = useState<CheckedIngredientsType>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [inventorySearchTerm, setInventorySearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddIngredienrOpen, setIsAddIngredientOpen] = useState(false)
  const filteredIngredients = Object.keys(allIngredients).filter(ingredient => 
    ingredient.toLowerCase().includes(searchTerm.toLowerCase())
  )


  
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      // Load ingredients inventory data
      try {
        const { ingredients, error } = await fetchIngredients();
        if (!error && ingredients) {
          setInventoryIngredients(ingredients);
        } else {
          console.error("Error loading ingredients:", error);
        }
      } catch (error) {
        console.error("Failed to load ingredients:", error);
      }

      const {orderIds} = await getOrderIds();
      console.log(orderIds)
      const orderId = orderIds[4].orderId;
      console.log(orderId)

      const orderDetail = await getOrderDetails(orderId)

      console.log(orderDetail)
      // Фильтруем только заказы в обработке

       const orders : OrderDetails[]= [];
      for (const id of orderIds) {
        console.log("getting orders for id ", id.orderId)
        const result = await getOrderDetails(id.orderId)
        if (result.orderDetails && result.orderDetails.length > 0) {
          orders.push(...result.orderDetails)
        }
      }
      console.log(orders)

      const processingOrders = orders.filter((order) => order.status === "ordering")
      console.log("proces....",processingOrders)
      setActiveOrders(orders)

      // Рассчитываем все необходимые ингредиенты
      const ingredients: AllIngredientsType = {}
      processingOrders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.quantity !== null) {
          for (let i = 0; i < item.quantity; i++) {
            item.ingredients.forEach((ingredient) => {
              if (ingredient.name!==null){
              if (!ingredients[ingredient.name] ) {
                ingredients[ingredient.name] = {
                  amounts: [],
                  orders: new Set(),
                }
              }
              ingredients[ingredient.name].amounts.push(ingredient.amount !== null? (+ingredient.amount): (0) )
              ingredients[ingredient.name].orders.add(order.id !== null ? (""+order.id): (""))
            }
            })
          }
          }
        }
        )
      })
      console.log("ingi",ingredients)
      setAllIngredients(ingredients)
      console.log("alllllll", allIngredients)
      

      // Инициализируем состояние проверки для всех ингредиентов
      const initialCheckedState: CheckedIngredientsType = {}
      Object.keys(ingredients).forEach((ingredient) => {
        initialCheckedState[ingredient] = false
      })
      setCheckedIngredients(initialCheckedState)
      
      setIsLoading(false);
    }
    
    loadData();
  }, [])
  console.log("alllllll", allIngredients)
  console.log("filter???", Object.keys(allIngredients))
  

  const toggleIngredientCheck = (ingredient: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [ingredient]: !prev[ingredient],
    }))
  }
  
 
  const getCompletionPercentage = (): number => {
    const total = Object.keys(checkedIngredients).length
    if (total === 0) return 0
    const checked = Object.values(checkedIngredients).filter(Boolean).length
    return Math.round((checked / total) * 100)
  }

  // Filter ingredients for inventory tab
  const filteredInventoryIngredients = inventoryIngredients
    .filter(ing => ing.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

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
                          {item.ingredients.map((ingredient, ingredientIndex) => {
                            // Create a unique key for this order-item-ingredient combination
                            const orderItemIngredientKey = `${order.id}:${item.name}:${ingredient.name}`;
                            
                            return (
                              <div key={ingredientIndex} className="flex items-center p-2 rounded-md border bg-muted/30">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{ingredient.name}</div>
                                  <div className="text-xs text-muted-foreground">{ingredient.amount}</div>
                                </div>
                                <Checkbox
                                  checked={checkedIngredients[orderItemIngredientKey] ?? false}
                                  onCheckedChange={() => {
                                    setCheckedIngredients(prev => ({
                                      ...prev,
                                      [orderItemIngredientKey]: !prev[orderItemIngredientKey]
                                    }));
                                  }}
                                />
                              </div>
                            );
                          })}
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
                <Input 
                  placeholder="Поиск ингредиентов..." 
                  value={inventorySearchTerm}
                  onChange={(e) => setInventorySearchTerm(e.target.value)}
                />
              </div>

              {isLoading ? (
                <div className="text-center py-8">Загрузка ингредиентов...</div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
                    <div className="col-span-4">Название</div>
                    <div className="col-span-2">В наличии</div>
                    <div className="col-span-2">Единица</div>
                    <div className="col-span-2">Статус</div>
                    <div className="col-span-2">Оповещения</div>
                  </div>

                  <div className="divide-y">
                    {filteredInventoryIngredients.length > 0 ? (
                      filteredInventoryIngredients.map((ingredient, index) => (
                        <div 
                          key={`${ingredient.name}-${index}`} 
                          className="grid grid-cols-12 gap-4 p-4 items-center"
                        >
                          <div className="col-span-4 font-medium">{ingredient.name}</div>
                          <div className="col-span-2">
                            {""+ingredient.stock} 
                          </div>
                          <div className="col-span-2">{ingredient.unit}</div>
                          <div className="col-span-2">
                            <span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                ingredient.status === "ok" 
                                  ? "bg-green-100 text-green-800" 
                                  : ingredient.status === "low" 
                                  ? "bg-yellow-100 text-yellow-800" 
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {ingredient.status}
                            </span>
                          </div>
                          <div className="col-span-2">
                            {ingredient.alert !== 0 ? (ingredient.alert) : (10)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 col-span-12">
                        Ингредиенты не найдены
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-4">
                <Button variant="outline">Экспорт инвентаря</Button>
                <Button onClick={() => setIsAddIngredientOpen(true)}>Добавить ингредиент</Button>
                {isAddIngredienrOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                      <h3 className="text-lg font-medium mb-4">Добавить новый ингредиент</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="ingredient-name">Название</Label>
                          <Input id="ingredient-name" placeholder="Название ингредиента" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="ingredient-stock">Количество</Label>
                            <Input id="ingredient-stock" type="number" placeholder="0" />
                          </div>
                          
                          <div>
                            <Label htmlFor="ingredient-unit">Единица измерения</Label>
                            <Input id="ingredient-unit" placeholder="г, кг, шт" />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="ingredient-alert">Порог оповещения</Label>
                          <Input id="ingredient-alert" type="number" placeholder="10" />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={() => setIsAddIngredientOpen(false)}>Отмена</Button>
                        <Button onClick={() => {
                          const name = (document.getElementById("ingredient-name") as HTMLInputElement).value;
                          const stock = Number((document.getElementById("ingredient-stock") as HTMLInputElement).value);
                          const unit = (document.getElementById("ingredient-unit") as HTMLInputElement).value;
                          const alert = Number((document.getElementById("ingredient-alert") as HTMLInputElement).value);
                          console.log("stock type", typeof(stock))
                          addIngredient(name, stock, unit, alert)

                          setIsAddIngredientOpen(false);
                        }}>Добавить</Button>
                      </div>
                    </div>
                  </div>
                )}
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
