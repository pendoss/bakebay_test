import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

export default function ProfilePage() {
  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center space-y-3">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder.svg" alt="Аватар пользователя" />
                  <AvatarFallback>ПЛ</AvatarFallback>
                </Avatar>
                <div className="space-y-1 text-center">
                  <h2 className="text-2xl font-bold">Имя Пользователя</h2>
                  <p className="text-muted-foreground">user@example.com</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Участник с</span>
                  <span>Июнь 2023</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Заказы</span>
                  <span>24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Отзывы</span>
                  <span>12</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Редактировать профиль</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:w-2/3">
          <Tabs defaultValue="account">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Аккаунт</TabsTrigger>
              <TabsTrigger value="orders">Заказы</TabsTrigger>
              <TabsTrigger value="addresses">Адреса</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Информация об аккаунте</CardTitle>
                  <CardDescription>Обновите данные вашего аккаунта здесь.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Имя</Label>
                      <Input id="firstName" defaultValue="Иван" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Фамилия</Label>
                      <Input id="lastName" defaultValue="Иванов" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue="user@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Номер телефона</Label>
                    <Input id="phone" defaultValue="+7 (999) 123-4567" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Сохранить изменения</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Изменить пароль</CardTitle>
                  <CardDescription>Обновите ваш пароль здесь.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Текущий пароль</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Новый пароль</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Обновить пароль</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>История заказов</CardTitle>
                  <CardDescription>Просмотрите ваши недавние заказы и их статус.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((order) => (
                      <div key={order} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">Заказ #{1000 + order}</h4>
                            <p className="text-sm text-muted-foreground">Размещен {order + 10} июня 2023</p>
                          </div>
                          <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                            {order === 1 ? "В обработке" : "Доставлен"}
                          </div>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between text-sm">
                          <span>Товаров: {order + 2}</span>
                          <span className="font-medium">${(order * 25).toFixed(2)}</span>
                        </div>
                        <Button variant="outline" size="sm" className="mt-3 w-full">
                          Подробнее
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Сохраненные адреса</CardTitle>
                  <CardDescription>Управляйте адресами доставки и выставления счетов.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">Домашний адрес</h4>
                          <p className="text-sm text-muted-foreground">Адрес доставки по умолчанию</p>
                        </div>
                        <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">По умолчанию</div>
                      </div>
                      <p className="text-sm mt-2">
                        ул. Сладкая, 123
                        <br />
                        кв. 4Б
                        <br />
                        Москва, 123456
                        <br />
                        Россия
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          Редактировать
                        </Button>
                        <Button variant="outline" size="sm">
                          Удалить
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">Рабочий адрес</h4>
                          <p className="text-sm text-muted-foreground">Альтернативный адрес доставки</p>
                        </div>
                      </div>
                      <p className="text-sm mt-2">
                        Офисная площадь, 456
                        <br />
                        офис 789
                        <br />
                        Москва, 123457
                        <br />
                        Россия
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          Редактировать
                        </Button>
                        <Button variant="outline" size="sm">
                          Удалить
                        </Button>
                        <Button variant="outline" size="sm">
                          Сделать основным
                        </Button>
                      </div>
                    </div>

                    <Button className="w-full">Добавить новый адрес</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
