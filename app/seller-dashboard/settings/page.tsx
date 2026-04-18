"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/
const urlRegex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i

const innValidator = (val: string) => {
  if (!val) return true
  const digits = val.replace(/\D/g, "")
  return digits.length === 10 || digits.length === 12
}

const profileSchema = z.object({
  seller_name: z.string().min(2, "Минимум 2 символа").max(80),
  description: z.string().max(500).optional().or(z.literal("")),
  about_products: z.string().max(1000).optional().or(z.literal("")),
  image_url: z
    .string()
    .trim()
    .refine((v) => !v || urlRegex.test(v), "Некорректный URL")
    .optional()
    .or(z.literal("")),
})

const contactsSchema = z.object({
  contact_name: z.string().min(2, "Минимум 2 символа").max(80),
  contact_email: z.string().email("Некорректный email"),
  contact_number: z.string().regex(phoneRegex, "Некорректный телефон"),
  location: z.string().max(120).optional().or(z.literal("")),
  website: z
    .string()
    .trim()
    .refine((v) => !v || urlRegex.test(v), "Некорректный URL")
    .optional()
    .or(z.literal("")),
  inn: z
    .string()
    .trim()
    .refine(innValidator, "ИНН должен содержать 10 или 12 цифр")
    .optional()
    .or(z.literal("")),
})

const accountSchema = z
  .object({
    first_name: z.string().min(1, "Обязательное поле"),
    last_name: z.string().min(1, "Обязательное поле"),
    email: z.string().email("Некорректный email"),
    phone_number: z.string().regex(phoneRegex, "Некорректный телефон"),
    currentPassword: z.string().optional().or(z.literal("")),
    newPassword: z.string().optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const wantsChange = data.currentPassword || data.newPassword || data.confirmPassword
    if (!wantsChange) return
    if (!data.currentPassword) {
      ctx.addIssue({ path: ["currentPassword"], code: "custom", message: "Введите текущий пароль" })
    }
    if (!data.newPassword || data.newPassword.length < 8) {
      ctx.addIssue({ path: ["newPassword"], code: "custom", message: "Минимум 8 символов" })
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ path: ["confirmPassword"], code: "custom", message: "Пароли не совпадают" })
    }
  })

type ProfileForm = z.infer<typeof profileSchema>
type ContactsForm = z.infer<typeof contactsSchema>
type AccountForm = z.infer<typeof accountSchema>

interface NotificationPrefs {
  newOrders: boolean
  newReviews: boolean
  newQuestions: boolean
  orderStatusChanges: boolean
  marketing: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  newOrders: true,
  newReviews: true,
  newQuestions: true,
  orderStatusChanges: true,
  marketing: false,
}

const PREFS_KEY = "seller:notification-prefs"

export default function SellerSettingsPage() {
  const { user, sellerId, refreshUser } = useUser()
  const { toast } = useToast()
  const [seller, setSeller] = useState<Record<string, unknown> | null>(null)
  const [loadingSeller, setLoadingSeller] = useState(true)
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { seller_name: "", description: "", about_products: "", image_url: "" },
  })

  const contactsForm = useForm<ContactsForm>({
    resolver: zodResolver(contactsSchema),
    defaultValues: {
      contact_name: "",
      contact_email: "",
      contact_number: "",
      location: "",
      website: "",
      inn: "",
    },
  })

  const accountForm = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) {
      try {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) })
      } catch {
        /* ignore */
      }
    }
  }, [])

  useEffect(() => {
    if (!sellerId) {
      setLoadingSeller(false)
      return
    }
    setLoadingSeller(true)
    fetch(`/api/sellers?id=${sellerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setSeller(data)
        profileForm.reset({
          seller_name: data.seller_name ?? "",
          description: data.description ?? "",
          about_products: data.about_products ?? "",
          image_url: data.image_url ?? "",
        })
        contactsForm.reset({
          contact_name: data.contact_name ?? "",
          contact_email: data.contact_email ?? "",
          contact_number: data.contact_number ?? "",
          location: data.location ?? "",
          website: data.website ?? "",
          inn: data.inn ?? "",
        })
      })
      .finally(() => setLoadingSeller(false))
  }, [sellerId])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return
    accountForm.reset({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number ?? "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }, [user])  // eslint-disable-line react-hooks/exhaustive-deps

  const saveSeller = async (data: Partial<ProfileForm & ContactsForm>) => {
    const resp = await fetch("/api/sellers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err.error || "Не удалось сохранить")
    }
    return resp.json()
  }

  const onSubmitProfile = async (data: ProfileForm) => {
    try {
      const updated = await saveSeller(data)
      setSeller(updated)
      toast({ title: "Профиль сохранён" })
    } catch (e) {
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" })
    }
  }

  const onSubmitContacts = async (data: ContactsForm) => {
    try {
      const updated = await saveSeller(data)
      setSeller(updated)
      toast({ title: "Контакты сохранены" })
    } catch (e) {
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" })
    }
  }

  const onSubmitAccount = async (data: AccountForm) => {
    try {
      const userResp = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone_number: data.phone_number,
        }),
      })
      if (!userResp.ok) throw new Error("Не удалось обновить аккаунт")

      if (data.currentPassword && data.newPassword) {
        const pwResp = await fetch("/api/users/password", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          }),
        })
        if (!pwResp.ok) {
          const err = await pwResp.json().catch(() => ({}))
          throw new Error(err.error || "Не удалось сменить пароль")
        }
        accountForm.resetField("currentPassword")
        accountForm.resetField("newPassword")
        accountForm.resetField("confirmPassword")
      }

      await refreshUser()
      toast({ title: "Аккаунт сохранён" })
    } catch (e) {
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" })
    }
  }

  const savePrefs = (next: NotificationPrefs) => {
    setPrefs(next)
    localStorage.setItem(PREFS_KEY, JSON.stringify(next))
    toast({ title: "Настройки уведомлений сохранены" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Настройки</h2>
        <p className="text-muted-foreground text-sm">
          Управляйте профилем магазина, контактами, аккаунтом и уведомлениями.
        </p>
      </div>
      <Separator />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="profile">Профиль</TabsTrigger>
          <TabsTrigger value="contacts">Контакты</TabsTrigger>
          <TabsTrigger value="account">Аккаунт</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Профиль магазина</CardTitle>
              <CardDescription>Эти данные видят покупатели на странице магазина.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSeller ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
                </div>
              ) : !seller ? (
                <p className="text-sm text-muted-foreground">Профиль магазина не найден.</p>
              ) : (
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="seller_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название магазина</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Краткое описание</FormLabel>
                          <FormControl><Textarea rows={3} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="about_products"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>О продукции</FormLabel>
                          <FormControl><Textarea rows={5} {...field} value={field.value ?? ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL логотипа</FormLabel>
                          <FormControl><Input placeholder="https://…" {...field} value={field.value ?? ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                      {profileForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Сохранить
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Контактные данные</CardTitle>
              <CardDescription>ИНН, телефон и сайт магазина. Видны покупателям.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSeller ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
                </div>
              ) : !seller ? (
                <p className="text-sm text-muted-foreground">Профиль магазина не найден.</p>
              ) : (
                <Form {...contactsForm}>
                  <form onSubmit={contactsForm.handleSubmit(onSubmitContacts)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={contactsForm.control}
                        name="contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Контактное лицо</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={contactsForm.control}
                        name="contact_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input type="email" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={contactsForm.control}
                        name="contact_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Телефон</FormLabel>
                            <FormControl><Input placeholder="+7…" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={contactsForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Город / адрес</FormLabel>
                            <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={contactsForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Сайт</FormLabel>
                            <FormControl><Input placeholder="https://…" {...field} value={field.value ?? ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={contactsForm.control}
                        name="inn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ИНН</FormLabel>
                            <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                            <FormDescription>10 цифр для юрлица, 12 для ИП</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={contactsForm.formState.isSubmitting}>
                      {contactsForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Сохранить
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Аккаунт</CardTitle>
              <CardDescription>Личные данные владельца аккаунта и смена пароля.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...accountForm}>
                <form onSubmit={accountForm.handleSubmit(onSubmitAccount)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={accountForm.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Имя</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={accountForm.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Фамилия</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={accountForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input type="email" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={accountForm.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Телефон</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium">Смена пароля</h3>
                    <p className="text-xs text-muted-foreground mb-3">Оставьте пустым, если менять не нужно.</p>
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={accountForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Текущий пароль</FormLabel>
                            <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={accountForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Новый пароль</FormLabel>
                            <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={accountForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Повтор пароля</FormLabel>
                            <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={accountForm.formState.isSubmitting}>
                    {accountForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Сохранить
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Уведомления</CardTitle>
              <CardDescription>Выберите, о чём напоминать в панели продавца.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                ["newOrders", "Новые заказы", "Показывать уведомление при поступлении заказа"],
                ["newReviews", "Новые отзывы", "Показывать уведомление при появлении отзыва"],
                ["newQuestions", "Новые вопросы о товарах", "Показывать уведомление о вопросах покупателей"],
                ["orderStatusChanges", "Смена статусов заказов", "Информировать о переходах статусов"],
                ["marketing", "Маркетинговые рассылки", "Новости платформы и советы продавцам"],
              ] as const).map(([key, title, desc]) => (
                <div key={key} className="flex items-start justify-between gap-4 rounded-md border p-4">
                  <div>
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-muted-foreground">{desc}</div>
                  </div>
                  <Switch
                    checked={prefs[key]}
                    onCheckedChange={(v) => savePrefs({ ...prefs, [key]: v })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
