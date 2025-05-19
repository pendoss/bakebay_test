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
import {useEffect, useState} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription, DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle
} from "@/components/ui/dialog";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {Eye, EyeOff, User} from "lucide-react";

interface AuthDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void
}


// interface AuthDialogProps {
//   isOpen: boolean;
//   setIsOpenAction: (isOpen: boolean) => void
// }
export function UserNav() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState<string | null>(null);

  useEffect(() => {
    // Access localStorage only on the client side
    setIsAuthenticatedUser(localStorage.getItem('auth'));
  }, []);

  const handleLogout = () : void => {
    localStorage.removeItem('auth');
    setIsAuthenticatedUser(null);
    router.push('/')
  }
  return (
      <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://s3.diploma.larek.tech/bakebay/user_placeholder_1.jpeg" alt="Аватар пользователя" />
            <AvatarFallback>
              <User />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Оливия Браун</p>
            <p className="text-xs leading-none text-muted-foreground">olivia.braun@test.com</p>
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
        {isAuthenticatedUser != null? (
          <DropdownMenuItem className="focus:bg-secondary focus:text-white" onClick={handleLogout}>Выйти</DropdownMenuItem>
          ) :(
          <DropdownMenuItem className="focus:bg-secondary focus:text-white" onClick={() => setIsOpen(true)}>Войти</DropdownMenuItem>
          )
        }
        
        
      </DropdownMenuContent>
    </DropdownMenu>

    <AuthDialog isOpen={isOpen} setIsOpen={setIsOpen}/>
    </>
  )
}
function AuthDialog({isOpen, setIsOpen}: AuthDialogProps) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDialogOpenChange = (open: boolean) => {
    console.log("Dialog onOpenChange called", open);
    setIsOpen(open);
  };

  const loginForm = useForm({
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const registerForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    }
  });

  function onLoginSubmit(){
    setIsLoading(true);
    console.log("Login form submitted", loginForm.getValues());
    fetch("/api/auth", {
      method: "POST",
      body: JSON.stringify(loginForm.getValues())
    }).then(async (resp: Response) =>{
      if (resp.status != 200){
        console.log("you are failed", resp)
        return
      }
      const payload = await resp.json()
      localStorage.setItem("auth", payload.token);
      setIsOpen(false);
    }).finally(() =>{
      setIsLoading(false)
    })

    
  }

  function onRegisterSubmit() {
    setIsLoading(true);
    console.log("Register form submitted", registerForm.getValues());
    fetch("/api/users", {
      method: "POST",
      body: JSON.stringify(registerForm.getValues())
    }).then(async (resp: Response) => {
      if (resp.status !== 200){
        console.log("failed", resp)
        return 
      }
      const payload = await resp.json()
      localStorage.setItem("auth", payload.token);
      setIsOpen(false);
    }).finally(() =>{
      setIsLoading(false)
    })
  }

  return (
      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 bg-black/30" />
          <DialogContent className="fixed top-1/2 left-1/2 w-full max-w-md p-6 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg">
            <DialogTitle className="text-lg font-semibold">Вход в систему</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-gray-600">
              Пожалуйста, введите свои учетные данные для входа.
            </DialogDescription>
            <Tabs defaultValue={mode} onValueChange={(value) => setMode(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="w-full">
                  Войти
                </TabsTrigger>
                <TabsTrigger value="register" className="w-full">
                  Зарегистрироваться
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="your.email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                                  <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                                  </Button>
                                </div>
                              </FormControl>
                              <div className="flex justify-end">
                                <Button
                                    variant="link"
                                    className="px-0 text-xs"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setMode("register")
                                    }}
                                >
                                  Забыли пароль?
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Вход..." : "Войти"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="register" className="mt-4">
                <DialogHeader>
                  <DialogDescription>Заполните все поля чтобы продолжить</DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                              <FormItem>
                                <FormLabel>Имя и Фамилия</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                          )}
                      />

                      <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="your.email@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                          )}
                      />

                      <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e)
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                      {showPassword ? (
                                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                          <Eye className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <span className="sr-only">{showPassword ? "Скрыть пароль" : "Показать пароль"}</span>
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                          )}
                      />

                      <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                              <FormItem>
                                <FormLabel>Подтвердить пароль</FormLabel>
                                <FormControl>
                                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                          )}
                      />

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Создание..." : "Создать аккаунт"}
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </DialogPortal>
      </Dialog>
  )
}