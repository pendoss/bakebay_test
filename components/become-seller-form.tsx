"use client"

import { useForm } from "react-hook-form"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Checkbox } from "./ui/checkbox"
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "./ui/form"
import {AlertCircle} from "lucide-react"
import {useToast} from "@/hooks/use-toast"
import {useUser} from "@/contexts/user-context"

export function BecomeSellerForm() {
    const {token, login, isLoading} = useUser()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const {toast} = useToast()

  const sellerForm = useForm({
    defaultValues: {
        seller_name: "",
      description: "",
        location: "",
      website: "",
      contact_name: "",
      contact_email: "",
      contact_number: "",
      inn: "",
      about_products: "",
        image_url: "",
    }
  })

  function onSubmit(values: any) {
      if (!token) return

      setIsSubmitting(true)
      fetch("/api/sellers", {
      method: "POST",
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
          },
      body: JSON.stringify(values)
      }).then(async (resp) => {
          if (!resp.ok) {
              const err = await resp.json().catch(() => ({}))
              toast({
                  title: "Ошибка при регистрации",
                  description: err.error || `Код ошибки: ${resp.status}`,
                  variant: "destructive",
              })
              setIsSubmitting(false)
              return
      }
          const data = await resp.json()
          if (data.token) {
              await login(data.token)
          }
          toast({title: "Заявка отправлена!", description: "Добро пожаловать в BakeBay как продавец."})
          setIsSubmitting(false)
      router.push('/')
      }).catch(() => {
          toast({title: "Ошибка сети", description: "Попробуйте ещё раз.", variant: "destructive"})
          setIsSubmitting(false)
      })
  }

    // Loading
    if (isLoading) {
        return <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
    }

    // Not authenticated
    if (!token) {
        return (
            <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                <h3 className="text-lg font-semibold mb-2">Требуется авторизация</h3>
                <p className="text-muted-foreground mb-6">
                    Чтобы зарегистрироваться как кондитер, необходимо войти в аккаунт. Воспользуйтесь кнопкой «Войти» в
                    шапке сайта.
                </p>
                <Button variant="outline" onClick={() => router.push('/')}>
                    На главную
                </Button>
            </Card>
        )
  }

  return (
    <Card className="p-6">
      <Form {...sellerForm}>
        <form onSubmit={sellerForm.handleSubmit(onSubmit)} className="space-y-6">

            {/* Image */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Фото продавца</h3>
                <FormField
                    control={sellerForm.control}
                    name="image_url"
                    rules={{required: "Фото обязательно"}}
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Ссылка на фото <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="https://example.com/photo.jpg" {...field} />
                            </FormControl>
                            <FormMessage/>
                            {field.value && (
                                <div className="mt-2 w-32 h-32 rounded-md overflow-hidden border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={field.value}
                                        alt="Превью"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none'
                                        }}
                                    />
                                </div>
                            )}
                        </FormItem>
                    )}
                />
            </div>

            {/* Business info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Информация о бизнесе</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={sellerForm.control}
                name="seller_name"
                rules={{required: "Название обязательно"}}
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>Название бизнеса <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                        <Input placeholder="Кондитер от мамы" {...field} />
                    </FormControl>
                      <FormMessage/>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={sellerForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание бизнеса</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Расскажите о своем бизнесе и что делает ваши продукты особенными"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={sellerForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Местоположение</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={sellerForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Вебсайт</FormLabel>
                    <FormControl>
                      <Input placeholder="https://" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

            {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Контактная информация</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={sellerForm.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Контактное лицо</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={sellerForm.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

              <FormField
              control={sellerForm.control}
              name="contact_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

            {/* Additional */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Дополнительная информация</h3>
            <FormField
              control={sellerForm.control}
              name="inn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ИНН</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={sellerForm.control}
              name="about_products"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>О ваших продуктах</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Расскажите подробнее о продуктах, которые вы производите"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="terms" required />
            <Label htmlFor="terms" className="text-sm">
              Я принимаю условия использования и политику конфиденциальности
            </Label>
          </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Отправка..." : "Отправить заявку"}
          </Button>
        </form>
      </Form>
    </Card>
  )
}
