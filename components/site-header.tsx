import Link from "next/link"
import Image from "next/image"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { CartIndicator } from "@/components/cart-indicator"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-primary">
            <Image src="/placeholder.svg?text=CB" alt="Логотип BakeBay" fill className="object-cover" />
          </div>
          <span className="hidden font-bold text-xl sm:inline-block">BakeBay</span>
        </Link>
        <div className="hidden md:flex">
          <MainNav />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="w-full max-w-xs lg:max-w-md">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Поиск товаров..." className="w-full pl-8" />
            </div>
          </div>
          <CartIndicator />
          <UserNav />
        </div>
      </div>
      <div className="container md:hidden">
        <div className="overflow-x-auto py-2">
          <MainNav className="inline-flex" />
        </div>
      </div>
    </header>
  )
}
