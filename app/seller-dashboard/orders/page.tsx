"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

// Import translations
import { statusTranslations } from "@/components/order-card"

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  date: string;
  customer: {
    name: string;
    email: string;
    address: string,
  };
  items: OrderItem[];
  total: number;
  status: string;
  paymentMethod: string;
  address: string;
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("newest")

  // Fetch orders from API
  useEffect(() => {
    const fetchSellerOrders = async () => {
      try {
        setLoading(true)
        
        // Get seller ID from localStorage or other auth source
        const sellerData = JSON.parse(localStorage.getItem('sellerData') || '{"id": 1}');
        const sellerId = sellerData.id;
        
        const response = await fetch(`/api/seller/orders?sellerId=${sellerId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(data);
        setOrders(data);
      } catch (err) {
        console.error("Error fetching seller orders:", err);
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSellerOrders();
  }, []);

  // Filter orders by search term
  const filteredOrders = orders.filter(order => {
    if (searchTerm === "") return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.customer.name.toLowerCase().includes(searchLower) ||
      order.customer.email.toLowerCase().includes(searchLower)
    );
  });
  
  // Filter orders by status
  const statusFilteredOrders = statusFilter === "all" 
    ? filteredOrders 
    : filteredOrders.filter(order => {
        // Map status to filter value
        const statusMap: Record<string, string> = {
          "ordering": "processing",
          "processing": "processing",
          "in_progress": "processing",
          "payed": "processing",
          "delivering": "shipped",
          "shipping": "shipped",
          "delivered": "delivered",
          "cancelled": "cancelled"
        };
        
        return statusMap[order.status] === statusFilter;
      });
  
  // Sort orders
  const sortedOrders = [...statusFilteredOrders].sort((a, b) => {
    switch (sortOrder) {
      case "newest":
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case "oldest":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "total-desc":
        return b.total - a.total;
      case "total-asc":
        return a.total - b.total;
      default:
        return 0;
    }
  });

  if (loading) {
    return <div className="text-center py-10">Загрузка заказов...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Ошибка: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Заказы</h2>
        <p className="text-muted-foreground">Просмотр и управление заказами клиентов</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="grid gap-2 w-full sm:max-w-[360px]">
          <Input 
            placeholder="Поиск заказов по ID или клиенту..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Статус заказа" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все заказы</SelectItem>
              <SelectItem value="processing">В обработке</SelectItem>
              <SelectItem value="shipped">Отправлены</SelectItem>
              <SelectItem value="delivered">Доставлены</SelectItem>
              <SelectItem value="cancelled">Отменены</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Новые</SelectItem>
              <SelectItem value="oldest">Старые</SelectItem>
              <SelectItem value="total-desc">Высокая сумма</SelectItem>
              <SelectItem value="total-asc">Низкая сумма</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
          <TabsTrigger value="all" className="flex-1 sm:flex-auto">
            Все заказы
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex-1 sm:flex-auto">
            В обработке
          </TabsTrigger>
          <TabsTrigger value="shipped" className="flex-1 sm:flex-auto">
            Отправлены
          </TabsTrigger>
          <TabsTrigger value="delivered" className="flex-1 sm:flex-auto">
            Доставлены
          </TabsTrigger>
        </TabsList>
        
        {sortedOrders.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Заказы не найдены
          </div>
        ) : (
          <>
            <TabsContent value="all" className="mt-4 space-y-4">
              {sortedOrders.map((order) => (
                <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
              ))}
            </TabsContent>
            <TabsContent value="processing" className="mt-4 space-y-4">
              {sortedOrders
                .filter((order) => order.status === "В обработке")
                .map((order) => (
                  <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                ))}
            </TabsContent>
            <TabsContent value="shipped" className="mt-4 space-y-4">
              {sortedOrders
                .filter((order) => order.status === "Отправлен")
                .map((order) => (
                  <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                ))}
            </TabsContent>
            <TabsContent value="delivered" className="mt-4 space-y-4">
              {sortedOrders
                .filter((order) => order.status === "Доставлен")
                .map((order) => (
                  <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                ))}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}

function OrderCard({ order, onStatusChange }: { order: Order; onStatusChange: (orderId: string, newStatus: string) => void }) {
  // Function to handle clicking the "mark as shipped" or "mark as delivered" button
  const handleStatusChange = (newStatus: string) => {
    onStatusChange(order.id, newStatus);
  };

  // Map status to our UI representation
  const displayStatus = statusTranslations[order.status as OrderStatus] || order.status;
  
  // Determine badge variant based on status
  const getBadgeVariant = (status: string) => {
    const statusMap: Record<string, "outline" | "secondary" | "default"> = {
      "ordering": "outline",
      "processing": "outline",
      "payed": "outline",
      "in_progress": "outline",
      "delivering": "secondary",
      "shipping": "secondary",
      "delivered": "default",
      "cancelled": "destructive"
    };
    
    return statusMap[status] || "outline";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Заказ #{order.id}</CardTitle>
              <Badge variant={getBadgeVariant(order.status)}>
                {displayStatus}
              </Badge>
            </div>
            <CardDescription>
              {order.date}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="font-semibold">{order.total.toFixed(2)} руб.</div>
            <div className="text-sm text-muted-foreground">
              {order.items.length} {order.items.length === 1 ? "товар" : order.items.length < 5 ? "товара" : "товаров"}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Информация о клиенте</h4>
            <div className="text-sm">
              <div>{order.customer.name}</div>
              <div className="text-muted-foreground">{order.customer.email}</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Товары в заказе</h4>
            <ul className="text-sm space-y-1">
              {order.items.map((item: OrderItem, index: number) => (
                <li key={index} className="flex justify-between">
                  <div>
                    {item.quantity} x {item.name}
                  </div>
                  <div>{(item.price * item.quantity).toFixed(2)} руб.</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Адрес доставки</h4>
              <div className="text-sm">{order.customer.address}</div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Статус оплаты</h4>
              <Badge variant="outline" className="font-normal">
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
      <CardContent className="border-t pt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          Просмотреть детали
        </Button>
        {["ordering", "processing", "payed", "in_progress"].includes(order.status) && (
          <Button size="sm" onClick={() => handleStatusChange("shipping")}>
            Отметить как отправленный
          </Button>
        )}
        {["shipping", "delivering"].includes(order.status) && (
          <Button size="sm" onClick={() => handleStatusChange("delivered")}>
            Отметить как доставленный
          </Button>
        )}
        <Button variant="outline" size="sm">
          Распечатать счет
        </Button>
      </CardContent>
    </Card>
  )
}

// Add status update handler function
function handleStatusChange(orderId: string, newStatus: string) {
  // Implement API call to update order status
  fetch('/api/orders', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      order_id: parseInt(orderId),
      order_status: newStatus,
    }),
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to update order status');
    return response.json();
  })
  .then(() => {
    // Refresh orders after status update
    window.location.reload();
  })
  .catch(error => {
    console.error('Error updating order status:', error);
    // Show error toast or notification
  });
}
