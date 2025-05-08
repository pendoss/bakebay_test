"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export function BecomeSellerForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e : React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Имитация отправки формы
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Заявка отправлена",
        description: "Мы рассмотрим вашу заявку и свяжемся с вами в ближайшее время.",
      })
    }, 1500)
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Информация о бизнесе</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Название бизнеса</Label>
              <Input id="businessName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Тип бизнеса</Label>
              <Select>
                <SelectTrigger id="businessType">
                  <SelectValue placeholder="Выберите тип бизнеса" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bakery">Пекарня</SelectItem>
                  <SelectItem value="patisserie">Кондитерская</SelectItem>
                  <SelectItem value="chocolatier">Шоколатье</SelectItem>
                  <SelectItem value="confectionery">Кондитерский цех</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание бизнеса</Label>
            <Textarea
              id="description"
              placeholder="Расскажите о своем бизнесе и что делает ваши продукты особенными"
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Местоположение</Label>
              <Input id="location" placeholder="Город, область" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Веб-сайт (необязательно)</Label>
              <Input id="website" type="url" placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Контактная информация</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Контактное лицо</Label>
              <Input id="contactName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Номер телефона</Label>
              <Input id="phone" type="tel" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">ИНН (необязательно)</Label>
              <Input id="taxId" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Информация о продукции</h3>

          <div className="space-y-2">
            <Label>Категории продукции (выберите все подходящие)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {["Торты", "Печенье", "Выпечка", "Шоколад", "Конфеты", "Хлеб", "Без глютена", "Веганское", "Другое"].map(
                (category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox id={`category-${category}`} />
                    <Label htmlFor={`category-${category}`} className="text-sm font-normal">
                      {category}
                    </Label>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productDescription">Расскажите о ваших продуктах</Label>
            <Textarea
              id="productDescription"
              placeholder="Что делает ваши продукты уникальными? Как они изготавливаются? Какие ингредиенты вы используете?"
              className="min-h-[100px]"
              required
            />
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox id="terms" required />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="terms" className="text-sm font-normal leading-snug">
              Я согласен с условиями обслуживания и правилами для продавцов
            </Label>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Отправка..." : "Отправить заявку"}
        </Button>
      </form>
    </Card>
  )
}
