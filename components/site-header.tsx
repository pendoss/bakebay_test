import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { CartIndicator } from "@/components/cart-indicator"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {/*<div className="relative h-8 w-8 overflow-hidden rounded-full bg-primary">*/}
          {/*  <Image src="/placeholder.svg?text=CB" alt="Логотип BakeBay" fill className="object-cover" />*/}
          {/*</div>*/}
          <span className="hidden font-bold text-xl sm:inline-block">BakeBay</span>
        </Link>
        <div className="hidden md:flex">
          <MainNav />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
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
