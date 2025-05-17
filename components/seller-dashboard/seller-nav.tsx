"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Package, ShoppingBag, BarChart3, MessageSquare, Star, Settings, HelpCircle, Utensils } from "lucide-react"

const routes = [
  {
    href: "/seller-dashboard",
    label: "Обзор",
    icon: BarChart3,
  },
  {
    href: "/seller-dashboard/products",
    label: "Товары",
    icon: Package,
  },
  {
    href: "/seller-dashboard/orders",
    label: "Заказы",
    icon: ShoppingBag,
  },
  {
    href: "/seller-dashboard/ingredients",
    label: "Ингредиенты",
    icon: Utensils,
  },
  {
    href: "/seller-dashboard/reviews",
    label: "Отзывы",
    icon: Star,
  },
  {
    href: "/seller-dashboard/questions",
    label: "Вопросы",
    icon: MessageSquare,
  },
  {
    href: "/seller-dashboard/settings",
    label: "Настройки",
    icon: Settings,
  },
]

export function SellerDashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid gap-2">
      {routes.map((route) => {
        const Icon = route.icon
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === route.href ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" />
            {route.label}
          </Link>
        )
      })}
      <div className="mt-4 py-4">
        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-medium flex items-center gap-1">
            <HelpCircle className="h-4 w-4" /> Нужна помощь?
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            Посетите наш Центр поддержки продавцов для руководств и помощи.
          </p>
          <Button variant="link" size="sm" className="px-0 text-xs mt-1">
            <Link href='https://t.me/tarasov_vasili1'>
            Перейти в Центр поддержки
            </Link>
            
          </Button>
        </div>
      </div>
    </nav>
  )
}
