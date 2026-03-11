"use client"

import { useEffect, useState } from "react";
import { ShoppingCart, Package, List, CheckCircle, Pencil, Check, X } from "lucide-react";
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
import {useUser} from "@/contexts/user-context";

export interface Ingredient {
    ingredient_id: number,
    name: string,
    amount: string,
    stock: number,
    unit: string,
    status: string,
    alert: number,
    purchase_qty: number,
    purchase_price: number,
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
  unit: string;
}

interface AllIngredientsType {
  [key: string]: IngredientDetail;
}

interface CheckedIngredientsType {
  [key: string]: boolean;
}

export default function IngredientsPage() {
  const {sellerId} = useUser()
  const [activeOrders, setActiveOrders] = useState<OrderDetails[]>([])
  const [allIngredients, setAllIngredients] = useState<AllIngredientsType>({})
  const [inventoryIngredients, setInventoryIngredients] = useState<Ingredient[]>([])
  const [checkedIngredients, setCheckedIngredients] = useState<CheckedIngredientsType>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [inventorySearchTerm, setInventorySearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ stock: 0, alert: 0, purchase_qty: 1, purchase_price: 0 })

  const filteredIngredients = Object.keys(allIngredients).filter(ingredient =>
    ingredient.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      try {
        const {ingredients, error} = await fetchIngredients(sellerId);
        if (!error && ingredients) {
          setInventoryIngredients(ingredients);
        } else {
          console.error("Error loading ingredients:", error);
        }
      } catch (error) {
        console.error("Failed to load ingredients:", error);
      }

      const {orderIds} = await getOrderIds(sellerId);

      const orders: OrderDetails[] = [];
      for (const id of orderIds) {
        const result = await getOrderDetails(id.orderId)
        if (result.orderDetails && result.orderDetails.length > 0) {
          orders.push(...result.orderDetails)
        }
      }

      const processingOrders = orders.filter((order) => order.status === "ordering")
      setActiveOrders(processingOrders)

      const ingredients: AllIngredientsType = {}
      processingOrders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.quantity !== null) {
            item.ingredients.forEach((ingredient) => {
              if (ingredient.name !== null) {
                if (!ingredients[ingredient.name]) {
                  ingredients[ingredient.name] = {
                    amounts: [],
                    orders: new Set(),
                    unit: ingredient.unit ?? "",
                  }
                }
                const amount = ingredient.amount !== null ? (+ingredient.amount) : 0;
                ingredients[ingredient.name].amounts.push(amount * item.quantity)
                ingredients[ingredient.name].orders.add(order.id !== null ? ("" + order.id) : (""))
              }
            })
          }
        })
      })
      setAllIngredients(ingredients)

      const initialCheckedState: CheckedIngredientsType = {}
      Object.keys(ingredients).forEach((ingredient) => {
        initialCheckedState[ingredient] = false
      })
      setCheckedIngredients(initialCheckedState)

      setIsLoading(false);
    }

    loadData();
  }, [sellerId])

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

  const filteredInventoryIngredients = inventoryIngredients
    .filter(ing => ing.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const startEdit = (ingredient: Ingredient) => {
    setEditingId(ingredient.ingredient_id)
    setEditForm({
      stock: ingredient.stock,
      alert: ingredient.alert,
      purchase_qty: ingredient.purchase_qty,
      purchase_price: ingredient.purchase_price,
    })
  }

  const handleSave = async (ingredient_id: number) => {
    await fetch('/api/product-ingredients', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredient_id,
        stock: editForm.stock,
        alert: editForm.alert,
        purchase_qty: editForm.purchase_qty,
        purchase_price: editForm.purchase_price,
      }),
    })
    setInventoryIngredients(prev =>
      prev.map(ing =>
        ing.ingredient_id === ingredient_id
          ? { ...ing, ...editForm }
          : ing
      )
    )
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Управление ингредиентами</h2>
        <p className="text-muted-foreground">Отслеживайте ингредиенты, необходимые для ваших ожидающих заказов</p>
      </div>

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
                    Object.keys(checkedIngredients).forEach((key) => { newState[key] = true })
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
                    Object.keys(checkedIngredients).forEach((key) => { newState[key] = false })
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
                            <Badge variant="outline">
                              {(allIngredients[ingredient]?.amounts.reduce((a, b) => a + b, 0) ?? 0).toFixed(2)} {allIngredients[ingredient]?.unit}
                            </Badge>
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
                          const orderItemIngredientKey = `${order.id}:${item.name}:${ingredient.name}`;
                          const totalAmount = (parseFloat(String(ingredient.amount)) || 0) * (item.quantity || 1);

                          return (
                            <div key={ingredientIndex} className="flex items-center p-2 rounded-md border bg-muted/30">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{ingredient.name}</div>
                                <div className="text-xs text-muted-foreground">{totalAmount.toFixed(2)} {ingredient.unit}</div>
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
                <div className="rounded-md border overflow-x-auto">
                  <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b min-w-[800px]">
                    <div className="col-span-2">Название</div>
                    <div className="col-span-1">В наличии</div>
                    <div className="col-span-1">Ед.</div>
                    <div className="col-span-2">Объем закупки</div>
                    <div className="col-span-2">Цена закупки</div>
                    <div className="col-span-1">Цена/ед.</div>
                    <div className="col-span-1">Статус</div>
                    <div className="col-span-1">Порог</div>
                    <div className="col-span-1"></div>
                  </div>

                  <div className="divide-y min-w-[800px]">
                    {filteredInventoryIngredients.length > 0 ? (
                      filteredInventoryIngredients.map((ingredient) => {
                        const isEditing = editingId === ingredient.ingredient_id;
                        const costPerUnit = isEditing
                          ? (editForm.purchase_qty > 0 ? editForm.purchase_price / editForm.purchase_qty : 0)
                          : (ingredient.purchase_qty > 0 ? ingredient.purchase_price / ingredient.purchase_qty : 0);

                        return (
                          <div
                            key={ingredient.ingredient_id}
                            className="grid grid-cols-12 gap-2 p-3 items-center"
                          >
                            <div className="col-span-2 font-medium">{ingredient.name}</div>

                            <div className="col-span-1">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  className="h-8 px-2"
                                  value={editForm.stock}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
                                />
                              ) : ingredient.stock}
                            </div>

                            <div className="col-span-1">{ingredient.unit}</div>

                            <div className="col-span-2">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  className="h-8 px-2"
                                  value={editForm.purchase_qty}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, purchase_qty: Number(e.target.value) }))}
                                />
                              ) : ingredient.purchase_qty}
                            </div>

                            <div className="col-span-2">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  className="h-8 px-2"
                                  value={editForm.purchase_price}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, purchase_price: Number(e.target.value) }))}
                                />
                              ) : ingredient.purchase_price > 0 ? `${ingredient.purchase_price} ₽` : "—"}
                            </div>

                            <div className="col-span-1 text-sm text-muted-foreground">
                              {costPerUnit > 0 ? `${costPerUnit.toFixed(2)} ₽` : "—"}
                            </div>

                            <div className="col-span-1">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
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

                            <div className="col-span-1">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  className="h-8 px-2"
                                  value={editForm.alert}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, alert: Number(e.target.value) }))}
                                />
                              ) : (ingredient.alert !== 0 ? ingredient.alert : 10)}
                            </div>

                            <div className="col-span-1 flex gap-1">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => handleSave(ingredient.ingredient_id)}
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => setEditingId(null)}
                                  >
                                    <X className="h-4 w-4 text-red-500" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => startEdit(ingredient)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 col-span-12">
                        Ингредиенты не найдены
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-4">
                <Button variant="outline">Экспорт инвентаря</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
