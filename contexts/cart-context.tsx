"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Типы данных
type CartItem = {
  id: number
  name: string
  price: number
  image: string
  quantity: number
  seller: string
}

type CartContextType = {
  items: CartItem[]
  addItem: (product: any, quantity?: number) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getItemsCount: () => number
}

// Создаем контекст
const CartContext = createContext<CartContextType | undefined>(undefined)

// Хук для использования контекста
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart должен использоваться внутри CartProvider")
  }
  return context
}

// Провайдер контекста
export function CartProvider({ children }: { children: ReactNode }) {
  // Пытаемся получить сохраненные данные корзины из localStorage
  const [items, setItems] = useState<CartItem[]>([])

  // Загружаем данные корзины при инициализации
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        setItems(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error("Ошибка при загрузке корзины:", error)
    }
  }, [])

  // Сохраняем данные корзины при изменении
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(items))
    } catch (error) {
      console.error("Ошибка при сохранении корзины:", error)
    }
  }, [items])

  // Для предотвращения двойных вызовов
  // const lastAddRef = useRef({ time: 0, id: null });
  // const isProcessingAddRef = useRef(false);

  // Добавление товара в корзину
  const addItem = (product: any, quantity = 1) => {
    console.log("addItem called", product.id, quantity);
    
    const productId = product.product_id || product.id;
    
    const item = items.find((v) => v.id === productId);
    if (item !== undefined) {
      updateQuantity(productId, item.quantity + 1);
      return;
    }
    
    setItems([
      ...items,
      {
        id: productId,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
        seller: product.seller,
      },
    ]);
  }

  // Удаление товара из корзины
  const removeItem = (id: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  // Обновление количества товара
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return

    setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  // Очистка корзины
  const clearCart = () => {
    setItems([])
  }

  // Получение общей суммы корзины
  const getCartTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  // Получение общего количества товаров
  const getItemsCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }

  // Значение контекста
  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemsCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
