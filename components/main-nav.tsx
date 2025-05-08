import Link from "next/link"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"


interface Props {
    className?: string
    [key: string]: any
}
export function MainNav({ className, ...props } : Props) {
  // Категории для выпадающего меню
  const categories = [
    { name: "Торты", href: "/catalog?category=Cakes" },
    { name: "Выпечка", href: "/catalog?category=Pastries" },
    { name: "Печенье", href: "/catalog?category=Cookies" },
    { name: "Капкейки", href: "/catalog?category=Cupcakes" },
    { name: "Брауни", href: "/catalog?category=Brownies" },
    { name: "Пироги", href: "/catalog?category=Pies" },
    { name: "Шоколад", href: "/catalog?category=Chocolates" },
    { name: "Веганские десерты", href: "/catalog?category=Vegan%20Desserts" },
    { name: "Без глютена", href: "/catalog?category=Gluten-Free" },
  ]

  const routes = [
    {
      href: "/",
      label: "Главная",
    },
    {
      href: "#",
      label: "Категории",
      dropdown: true,
      items: categories,
    },
    {
      href: "/catalog",
      label: "Все товары",
    },
    {
      href: "/sellers",
      label: "Кондитеры",
    },
    {
      href: "/deals",
      label: "Акции",
    },
  ]

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      {routes.map((route) =>
        route.dropdown ? (
          <DropdownMenu key={route.label}>
            <DropdownMenuTrigger className="flex items-center text-sm font-medium transition-colors hover:text-primary focus:outline-none">
              {route.label} <ChevronDown className="ml-1 h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {route.items.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link href={item.href}>{item.name}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link key={route.href} href={route.href} className="text-sm font-medium transition-colors hover:text-primary">
            {route.label}
          </Link>
        ),
      )}
    </nav>
  )
}
