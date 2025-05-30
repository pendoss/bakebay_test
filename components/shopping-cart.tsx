"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Minus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"

export function ShoppingCart() {
  const router = useRouter()
  const { toast } = useToast()
  const { items, removeItem, updateQuantity, clearCart, getCartTotal } = useCart()
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)

  const applyPromoCode = () => {
    if (promoCode.trim() === "") return
    setPromoApplied(true)
    toast({
      title: "Промокод применен",
      description: "Скидка 10% успешно применена к вашему заказу.",
    })
  }

  // Расчет итогов
  const subtotal = getCartTotal()
  const discount = promoApplied ? subtotal * 0.1 : 0
  const shipping = subtotal > 50 ? 0 : 5.99
  const tax = (subtotal - discount) * 0.08
  const total = subtotal - discount + shipping + tax

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Ваша корзина пуста</h2>
        <p className="text-muted-foreground mb-6">Похоже, вы еще не добавили сладости в корзину.</p>
        <Button onClick={() => router.push("/catalog")}>Продолжить покупки</Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-32 h-32 relative">
                <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">Продавец: {item.seller}</p>
                  </div>
                  <div className="text-lg font-semibold">{(item.price * item.quantity).toFixed(2)} руб.</div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                      <span className="sr-only">Уменьшить количество</span>
                    </Button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                      <span className="sr-only">Увеличить количество</span>
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => router.push("/catalog")}>
            Продолжить покупки
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              clearCart()
              toast({
                title: "Корзина очищена",
                description: "Все товары были удалены из корзины.",
              })
            }}
          >
            Очистить корзину
          </Button>
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Итого заказа</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Подытог ({items.reduce((sum, item) => sum + item.quantity, 0)} товаров)</span>
              <span>{subtotal.toFixed(2)} руб.</span>
            </div>

            {promoApplied && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Скидка (10%)</span>
                <span>-{discount.toFixed(2)} руб.</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span>Доставка</span>
              <span>{shipping === 0 ? "Бесплатно" : `${shipping.toFixed(2)} руб.`}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Налог</span>
              <span>{tax.toFixed(2)} руб.</span>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Итого</span>
              <span>{total.toFixed(2)} руб.</span>
            </div>

            <div className="pt-4">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Промокод"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={promoApplied}
                />
                <Button variant="outline" onClick={applyPromoCode} disabled={promoApplied || promoCode.trim() === ""}>
                  Применить
                </Button>
              </div>

              {promoApplied && <div className="text-sm text-green-600 mb-4">Промокод успешно применен!</div>}

              <Button 
                className="w-full" 
                onClick={async () => {
                  try {
                    // Check if there are items in the cart
                    if (items.length === 0) {
                      toast({
                        title: "Корзина пуста",
                        description: "Добавьте товары в корзину перед оформлением заказа.",
                        variant: "destructive"
                      });
                      return;
                    }

                    // Get user data from localStorage or session
                    const userData = JSON.parse(localStorage.getItem('userData') || '{"id": 2}');

                    // Log the items we're sending for debugging
                    console.log("Cart items being sent:", items);

                    // Make sure we're sending valid product_id values
                    const orderData = {
                      user_id: userData.id,
                      address: localStorage.getItem('userAddress') || "123 Main St, City",
                      payment_method: localStorage.getItem('paymentMethod') || "Credit Card",
                      items: items.map(item => ({
                        // Ensure we're using the correct ID format
                        product_id: typeof item.id === 'string' ? parseInt(item.id, 10) : item.id,
                        quantity: item.quantity
                      }))
                    };

                    console.log("Order data being sent:", orderData);

                    // Send order to API
                    const response = await fetch('/api/orders', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(orderData),
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      console.error('Error response:', errorData);
                      throw new Error(errorData.error || 'Failed to create order');
                    }

                    const data = await response.json();

                    // Clear cart after successful order
                    clearCart();

                    // Show success message
                    toast({
                      title: "Заказ успешно оформлен",
                      description: `Ваш заказ #${data.order_id} был успешно создан.`,
                    });

                    // Redirect to orders page
                    router.push('/orders');
                  } catch (err) {
                    console.error('Error creating order:', err);
                    toast({
                      title: "Ошибка при оформлении заказа",
                      description: err instanceof Error ? err.message : "Произошла ошибка при оформлении заказа.",
                      variant: "destructive"
                    });
                  }
                }}
              >
                Перейти к оформлению
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            <p>
              Переходя к оформлению, вы соглашаетесь с нашими условиями обслуживания и политикой конфиденциальности.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
