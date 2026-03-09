"use client"

import {useState, useEffect, useRef} from "react"
import {useRouter} from "next/navigation"
import {useUser} from "@/contexts/user-context"
import {cn} from "@/lib/utils"
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {z} from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {Avatar, AvatarFallback} from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {Badge} from "@/components/ui/badge"
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form"
import {useToast} from "@/hooks/use-toast"

// ─── Schemas ───────────────────────────────────────────────────────────────

const profileSchema = z.object({
    first_name: z.string().min(1, "Обязательное поле"),
    last_name: z.string().min(1, "Обязательное поле"),
    email: z.string().email("Некорректный email"),
    phone_number: z.string().min(1, "Введите телефон"),
    address: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, "Введите текущий пароль"),
        newPassword: z.string().min(6, "Минимум 6 символов"),
        confirmPassword: z.string().min(1, "Подтвердите пароль"),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: "Пароли не совпадают",
        path: ["confirmPassword"],
    })
type PasswordForm = z.infer<typeof passwordSchema>

// ─── Types ─────────────────────────────────────────────────────────────────

type UserInfo = {
    user_id: number
    first_name: string
    last_name: string
    email: string
    phone_number: string
    address: string | null
    city: string | null
    postal_code: string | null
    country: string | null
    user_role: string
    created_at: string
}

type Order = {
    id: string
    date: string
    status: string
    total: number
    items: { name: string; quantity: number }[]
}

const STATUS_LABELS: Record<string, string> = {
    ordering: "Оформляется",
    processing: "Обрабатывается",
    payed: "Оплачен",
    processed: "Обработан",
    in_progress: "В процессе",
    delivering: "Доставляется",
    delivered: "Доставлен",
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const router = useRouter()
    const {toast} = useToast()
    const {token, user: contextUser, refreshUser} = useUser()

    const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [loadingOrders, setLoadingOrders] = useState(false)
    const [savingProfile, setSavingProfile] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)
    const [activeTab, setActiveTab] = useState("account")
    const [highlightAddress, setHighlightAddress] = useState(false)
    const addressSectionRef = useRef<HTMLDivElement>(null)

    const profileForm = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: "", last_name: "", email: "",
            phone_number: "", address: "", city: "", postal_code: "", country: "",
        },
    })

    const passwordForm = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {currentPassword: "", newPassword: "", confirmPassword: ""},
    })

    // ── Load user data ─────────────────────────────────────────────────────

    useEffect(() => {
        if (!contextUser) return

        setUserInfo({
            ...contextUser,
            phone_number: contextUser.phone_number ?? "",
            address: contextUser.address ?? null,
            city: contextUser.city ?? null,
            postal_code: contextUser.postal_code ?? null,
            country: contextUser.country ?? null,
            created_at: contextUser.created_at ?? "",
        })
        profileForm.reset({
            first_name: contextUser.first_name,
            last_name: contextUser.last_name,
            email: contextUser.email,
            phone_number: contextUser.phone_number ?? "",
            address: contextUser.address ?? "",
            city: contextUser.city ?? "",
            postal_code: contextUser.postal_code ?? "",
            country: contextUser.country ?? "",
        })

        setLoadingOrders(true)
        fetch(`/api/orders?userId=${contextUser.user_id}`)
            .then((r) => (r.ok ? r.json() : []))
            .then(setOrders)
            .finally(() => setLoadingOrders(false))
    }, [contextUser?.user_id]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Handlers ───────────────────────────────────────────────────────────

    async function onProfileSave(data: ProfileForm) {
        setSavingProfile(true)
        try {
            const resp = await fetch("/api/users", {
                method: "PUT",
                headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
                body: JSON.stringify(data),
            })
            if (!resp.ok) throw new Error()
            const updated: UserInfo = await resp.json()
            setUserInfo(updated)
            refreshUser()
            toast({title: "Профиль обновлён"})
        } catch {
            toast({title: "Ошибка", description: "Не удалось сохранить изменения", variant: "destructive"})
        } finally {
            setSavingProfile(false)
        }
    }

    async function onPasswordSave(data: PasswordForm) {
        setSavingPassword(true)
        try {
            const resp = await fetch("/api/users/password", {
                method: "PUT",
                headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
                body: JSON.stringify({currentPassword: data.currentPassword, newPassword: data.newPassword}),
            })
            if (!resp.ok) {
                const err = await resp.json()
                toast({title: "Ошибка", description: err.error ?? "Не удалось изменить пароль", variant: "destructive"})
                return
            }
            passwordForm.reset()
            toast({title: "Пароль изменён"})
        } catch {
            toast({title: "Ошибка", description: "Не удалось изменить пароль", variant: "destructive"})
        } finally {
            setSavingPassword(false)
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────

    function goToAddressSection() {
        setActiveTab("account")
        setTimeout(() => {
            setHighlightAddress(true)
            addressSectionRef.current?.scrollIntoView({behavior: "smooth", block: "nearest"})
        }, 60)
    }

    if (!userInfo) return null

    const initials = userInfo.first_name[0].toUpperCase() + userInfo.last_name[0].toUpperCase()
    const memberSince = new Date(userInfo.created_at).toLocaleDateString("ru-RU", {month: "long", year: "numeric"})

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row gap-8">

          {/* ── Sidebar ────────────────────────────────────────────────── */}
        <div className="md:w-1/3">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center space-y-3">
                <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 text-center">
                    <h2 className="text-2xl font-bold">
                        {userInfo.first_name} {userInfo.last_name}
                    </h2>
                    <p className="text-muted-foreground">{userInfo.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Участник с</span>
                    <span>{memberSince}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Заказы</span>
                    <span>{orders.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

          {/* ── Tabs ───────────────────────────────────────────────────── */}
        <div className="md:w-2/3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Аккаунт</TabsTrigger>
              <TabsTrigger value="orders">Заказы</TabsTrigger>
              <TabsTrigger value="addresses">Адреса</TabsTrigger>
            </TabsList>

                {/* ── Account ──────────────────────────────────────────── */}
            <TabsContent value="account" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Информация об аккаунте</CardTitle>
                  <CardDescription>Обновите данные вашего аккаунта здесь.</CardDescription>
                </CardHeader>
                  <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSave)}>
                          <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField control={profileForm.control} name="first_name" render={({field}) => (
                                      <FormItem>
                                          <FormLabel>Имя</FormLabel>
                                          <FormControl><Input {...field} /></FormControl>
                                          <FormMessage/>
                                      </FormItem>
                                  )}/>
                                  <FormField control={profileForm.control} name="last_name" render={({field}) => (
                                      <FormItem>
                                          <FormLabel>Фамилия</FormLabel>
                                          <FormControl><Input {...field} /></FormControl>
                                          <FormMessage/>
                                      </FormItem>
                                  )}/>
                              </div>
                              <FormField control={profileForm.control} name="email" render={({field}) => (
                                  <FormItem>
                                      <FormLabel>Email</FormLabel>
                                      <FormControl><Input {...field} /></FormControl>
                                      <FormMessage/>
                                  </FormItem>
                              )}/>
                              <FormField control={profileForm.control} name="phone_number" render={({field}) => (
                                  <FormItem>
                                      <FormLabel>Телефон</FormLabel>
                                      <FormControl><Input {...field} /></FormControl>
                                      <FormMessage/>
                                  </FormItem>
                              )}/>

                              <div
                                  ref={addressSectionRef}
                                  className={cn("space-y-4", highlightAddress && "address-flow")}
                                  onAnimationEnd={() => setHighlightAddress(false)}
                              >
                                  <Separator/>
                                  <p className="text-sm font-medium">Адрес доставки</p>

                                  <FormField control={profileForm.control} name="address" render={({field}) => (
                                      <FormItem>
                                          <FormLabel>Улица и дом</FormLabel>
                                          <FormControl><Input
                                              placeholder="ул. Примерная, д. 1" {...field} /></FormControl>
                                          <FormMessage/>
                                      </FormItem>
                                  )}/>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <FormField control={profileForm.control} name="city" render={({field}) => (
                                          <FormItem>
                                              <FormLabel>Город</FormLabel>
                                              <FormControl><Input placeholder="Москва" {...field} /></FormControl>
                                              <FormMessage/>
                                          </FormItem>
                                      )}/>
                                      <FormField control={profileForm.control} name="postal_code" render={({field}) => (
                                          <FormItem>
                                              <FormLabel>Индекс</FormLabel>
                                              <FormControl><Input placeholder="123456" {...field} /></FormControl>
                                              <FormMessage/>
                                          </FormItem>
                                      )}/>
                                      <FormField control={profileForm.control} name="country" render={({field}) => (
                                          <FormItem>
                                              <FormLabel>Страна</FormLabel>
                                              <FormControl><Input placeholder="Россия" {...field} /></FormControl>
                                              <FormMessage/>
                                          </FormItem>
                                      )}/>
                                  </div>
                              </div>
                          </CardContent>
                          <CardFooter>
                              <Button type="submit" disabled={savingProfile}>
                                  {savingProfile ? "Сохранение..." : "Сохранить изменения"}
                              </Button>
                          </CardFooter>
                      </form>
                  </Form>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Изменить пароль</CardTitle>
                  <CardDescription>Обновите ваш пароль здесь.</CardDescription>
                </CardHeader>
                  <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSave)}>
                          <CardContent className="space-y-4">
                              <FormField control={passwordForm.control} name="currentPassword" render={({field}) => (
                                  <FormItem>
                                      <FormLabel>Текущий пароль</FormLabel>
                                      <FormControl><Input type="password" {...field} /></FormControl>
                                      <FormMessage/>
                                  </FormItem>
                              )}/>
                              <FormField control={passwordForm.control} name="newPassword" render={({field}) => (
                                  <FormItem>
                                      <FormLabel>Новый пароль</FormLabel>
                                      <FormControl><Input type="password" {...field} /></FormControl>
                                      <FormMessage/>
                                  </FormItem>
                              )}/>
                              <FormField control={passwordForm.control} name="confirmPassword" render={({field}) => (
                                  <FormItem>
                                      <FormLabel>Подтвердите пароль</FormLabel>
                                      <FormControl><Input type="password" {...field} /></FormControl>
                                      <FormMessage/>
                                  </FormItem>
                              )}/>
                          </CardContent>
                          <CardFooter>
                              <Button type="submit" disabled={savingPassword}>
                                  {savingPassword ? "Сохранение..." : "Обновить пароль"}
                              </Button>
                          </CardFooter>
                      </form>
                  </Form>
              </Card>
            </TabsContent>

                {/* ── Orders ───────────────────────────────────────────── */}
            <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>История заказов</CardTitle>
                            <CardDescription>Ваши последние 5 заказов.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.push("/orders")}>
                            Все заказы
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingOrders ? (
                        <p className="text-sm text-muted-foreground">Загрузка...</p>
                    ) : orders.length === 0 ? (
                        <p className="text-sm text-muted-foreground">У вас пока нет заказов.</p>
                    ) : (
                        <div className="space-y-4">
                            {orders.slice(0, 5).map((order) => (
                                <div key={order.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-medium">Заказ #{order.id}</h4>
                                            <p className="text-sm text-muted-foreground">{order.date}</p>
                                        </div>
                                        <Badge variant="outline">
                                            {STATUS_LABELS[order.status] ?? order.status}
                                        </Badge>
                                    </div>
                                    <Separator className="my-2"/>
                                    <div className="flex justify-between text-sm">
                                        <span>Товаров: {order.items.length}</span>
                                        <span className="font-medium">{order.total} ₽</span>
                                    </div>
                                    <Button
                                        variant="outline" size="sm" className="mt-3 w-full"
                                        onClick={() => router.push("/orders")}
                                    >
                                        Подробнее
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>

                {/* ── Addresses ────────────────────────────────────────── */}
            <TabsContent value="addresses" className="mt-6">
              <Card>
                <CardHeader>
                    <CardTitle>Адрес доставки</CardTitle>
                    <CardDescription>
                        Ваш основной адрес доставки. Редактируйте его во вкладке «Аккаунт».
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {userInfo.address ? (
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">Основной адрес</h4>
                          <Badge variant="outline">По умолчанию</Badge>
                      </div>
                        <p className="text-sm mt-2 text-muted-foreground">
                            {userInfo.address}
                            {userInfo.city && <>, {userInfo.city}</>}
                            {userInfo.postal_code && <> {userInfo.postal_code}</>}
                            {userInfo.country && <>, {userInfo.country}</>}
                      </p>
                        <Button
                            variant="outline" size="sm" className="mt-3"
                            onClick={goToAddressSection}
                        >
                            Редактировать
                        </Button>
                    </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground mb-4">
                                Адрес не указан.
                      </p>
                            <Button variant="outline" onClick={goToAddressSection}>
                                Добавить адрес
                            </Button>
                        </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
