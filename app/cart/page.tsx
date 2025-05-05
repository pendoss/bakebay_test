import { ShoppingCart } from "@/components/shopping-cart"

export default function CartPage() {
  return (
    <div className="container py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Ваша корзина</h1>
      <p className="text-muted-foreground mb-8">Просмотрите и управляйте выбранными товарами</p>
      <ShoppingCart />
    </div>
  )
}
