"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { OrderTimeline } from "@/components/order-timeline"
import { ChevronDown, ChevronUp, Package, RefreshCw, XCircle, MessageSquare } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"

// Define the OrderStatus type to match the one in other files
type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';

// Переводы статусов заказа
const statusTranslations: Record<OrderStatus, string> = {
    placed: "Оформлен",
    confirmed: "Подтвержден",
    preparing: "Готовится",
    shipping: "Доставляется",
    delivered: "Доставлен",
    cancelled: "Отменен",
}

// Цвета для статусов
const statusColors: Record<OrderStatus, string> = {
    placed: "bg-lemon-meringue text-secondary",
    confirmed: "bg-lavender-dessert text-secondary",
    preparing: "bg-mint-frosting text-secondary",
    shipping: "bg-caramel-light text-secondary",
    delivered: "bg-strawberry-cream text-secondary",
    cancelled: "bg-muted text-muted-foreground",
}


interface OrderCardProps {
    order: {
        id: string
        date: string
        total: number
        items: Array<{
            name: string
            quantity: number
            price: number
            image?: string
        }>
        status: OrderStatus
        statusHistory: Array<{
            status: OrderStatus
            completed?: boolean
            date?: string | null
        }>
        address: string
        paymentMethod: string
        cancellationReason?: string
    }
}
export function OrderCard({ order } : OrderCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { addItem } = useCart()
    const { toast } = useToast()

    const handleRepeatOrder = () => {
        // Add all items from the order to the cart
        order.items.forEach((item, index) => {
            // Create a product object that matches what addItem expects
            const product = {
                id: Date.now() + index, // Generate a unique ID using timestamp + index
                name: item.name,
                price: item.price,
                image: item.image || "/placeholder.svg",
                seller: "Unknown", // We don't have seller info in the order items
                quantity: item.quantity
            }

            // Add the item to the cart
            addItem(product, item.quantity)
        })

        // Show a success toast
        toast({
            title: "Заказ добавлен в корзину",
            description: `${order.items.length} ${order.items.length === 1 ? "товар" : order.items.length < 5 ? "товара" : "товаров"} добавлено в корзину.`,
        })
    }

    return (
        <Card className="overflow-hidden border-lavender-dessert/30">
            <CardHeader className="p-4 pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">Заказ {order.id}</h3>
                                <Badge className={statusColors[order.status]}>{statusTranslations[order.status]}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Оформлен {order.date}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="font-semibold">${order.total.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                            {order.items.length} {order.items.length === 1 ? "товар" : order.items.length < 5 ? "товара" : "товаров"}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order Items on the left */}
                    <div className="space-y-3">
                        <h4 className="font-medium mb-3">Содержимое заказа</h4>
                        {order.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="relative h-16 w-16 overflow-hidden rounded-md flex-shrink-0">
                                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-medium truncate">{item.name}</h5>
                                    <p className="text-sm text-muted-foreground">
                                        Количество: {item.quantity} × ${item.price.toFixed(2)}
                                    </p>
                                </div>
                                <div className="font-medium">${(item.quantity * item.price).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>

                    {/* Timeline on the right */}
                    <div>
                        <OrderTimeline statusHistory={order.statusHistory} />
                    </div>
                </div>

                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <div className="flex items-center justify-start mt-6">
                        <h4 className="font-medium pt-1">Дополнительные детали</h4>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent className="mt-4 space-y-4">

                        <Separator className="bg-lavender-dessert/30" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <h5 className="font-medium mb-1">Адрес доставки</h5>
                                <p className="text-muted-foreground">{order.address}</p>
                            </div>
                            <div>
                                <h5 className="font-medium mb-1">Способ оплаты</h5>
                                <p className="text-muted-foreground">{order.paymentMethod}</p>
                            </div>
                        </div>

                        {order.status === "cancelled" && (
                            <div className="bg-muted/30 p-3 rounded-md">
                                <h5 className="font-medium mb-1">Причина отмены</h5>
                                <p className="text-muted-foreground">{order.cancellationReason}</p>
                            </div>
                        )}
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
                {order.status === "delivered" && (
                    <Button variant="outline" className="gap-1" onClick={handleRepeatOrder}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Повторить заказ
                    </Button>
                )}

                {["placed", "confirmed"].includes(order.status) && (
                    <Button variant="outline" className="text-destructive gap-1">
                        <XCircle className="h-4 w-4 mr-1" />
                        Отменить заказ
                    </Button>
                )}

                <Button variant="outline" className="gap-1">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Связаться с поддержкой
                </Button>

                {["shipping", "preparing"].includes(order.status) && (
                    <Button variant="outline" className="gap-1">
                        <Package className="h-4 w-4 mr-1" />
                        Отследить доставку
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
