"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

export function UserNav() {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt="Аватар пользователя" />
            <AvatarFallback>ПЛ</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Имя Пользователя</p>
            <p className="text-xs leading-none text-muted-foreground">user@example.com</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/profile")} className="focus:bg-secondary focus:text-white">Профиль</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/orders")} className="focus:bg-secondary focus:text-white">Заказы</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/wishlist")} className="focus:bg-secondary focus:text-white">Избранное</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/seller-dashboard")} className="focus:bg-secondary focus:text-white">Панель продавца</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")} className="focus:bg-secondary focus:text-white">Настройки</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="focus:bg-secondary focus:text-white">Выйти</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
