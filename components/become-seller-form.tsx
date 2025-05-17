"use client"

import { useForm } from "react-hook-form"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Textarea } from "./ui/textarea"
import { Checkbox } from "./ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form"

export function BecomeSellerForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const sellerForm = useForm({
    defaultValues: {
      seller_name: "Кондитер от мамы",
      description: "",
      location: "Москва",
      website: "",
      contact_name: "",
      contact_email: "",
      contact_number: "",
      inn: "",
      about_products: "",
    }
  });

  function onSubmit(values: any) {
    setIsSubmitting(true);
    console.log("Submitting seller-form", values);
    fetch("api/sellers", {
      method: "POST",
      body: JSON.stringify(values)
    }).then(async (resp: Response) => {
      if (resp.status !== 200) {
        console.log('Failed: sellerForm');
        return 
      }
    }).finally(() => {
      setIsSubmitting(false);
      router.push('/')
    });
  }
  
  return (
    <Card className="p-6">
      <Form {...sellerForm}>
        <form onSubmit={sellerForm.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Информация о бизнесе</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={sellerForm.control}
                name="seller_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="seller_name">Название бизнеса</FormLabel>
                    <FormControl>
                      <Input 
                        id="seller_name" 
                        placeholder="Кондитер от мамы" 
                        {...field}
                      />
                    </FormControl>
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