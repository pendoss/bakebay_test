import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/footer"
import { Clock, Star, ShieldCheck, ChevronRight, Cake, Utensils, Gift, Cookie } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/70 to-primary/70 -z-10"></div>
        <div className="absolute inset-0 opacity-5 -z-10">
          <Image src="/placeholder.svg?height=800&width=1600" alt="Фоновый узор" fill className="object-cover" />
        </div>
        <div className="container relative z-10 px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-lg">
              <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3 py-1">
                Свежая выпечка для счастья
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-secondary">
                Авторские торты с доставкой
              </h1>
              <p className="text-lg text-secondary/100">
                BakeBay соединяет вас с местными кондитерами для свежих, ручной работы десертов с быстрой доставкой.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  asChild
                  className="font-medium bg-primary text-white hover:bg-primary/90 transition-all"
                >
                  <Link href="/catalog">Смотреть торты</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-secondary border-2 text-secondary font-medium hover:bg-secondary hover:text-white hover:border-secondary transition-all shadow-sm"
                >
                  <Link href="/sellers">Наши кондитеры</Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 text-secondary/80">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-primary/20 overflow-hidden">
                      <Image src={`/placeholder.svg?text=${i}`} alt={`Клиент ${i}`} width={32} height={32} />
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="text-primary font-medium">4.9</span> (2,500+ отзывов)
                </div>
              </div>
            </div>
            <div className="relative h-[400px] md:h-[450px] rounded-2xl overflow-hidden shadow-xl flex items-center justify-center">
              <Image
                src="https://fcqcyg8v9r.ufs.sh/f/XftHnGEAztMCZ2FbIh6iMKG1X7p5WIR0j28JA4QElqLsP6vn"
                alt="Витрина вкусных тортов"
                sizes="(max-width: 500px), 100vw, 33vw"
                width={500}
                height={600}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-secondary">Почему выбирают BakeBay?</h2>
            <p className="text-secondary max-w-2xl mx-auto">
              Мы переосмыслили процесс заказа и доставки десертов, делая его безупречным от клика до первого кусочка.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-md border-none shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-secondary">Молниеносная доставка</h3>
                <p className="text-secondary/80">
                  Наша сеть местных кондитеров означает, что ваши десерты прибывают свежими, часто в течение нескольких
                  часов после заказа.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md border-none shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-secondary">Авторское качество</h3>
                <p className="text-secondary/80">
                  Каждый кондитер на нашей платформе проверен на качество, гарантируя вам исключительные десерты каждый
                  раз.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md border-none shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-secondary">Гарантия удовлетворения</h3>
                <p className="text-secondary/80">
                  Не довольны заказом? Мы исправим это с нашей 100% гарантией удовлетворения.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-accent/50 -z-10"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <Image src="/placeholder.svg?height=400&width=600" alt="История BakeBay" fill className="object-cover" />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight text-secondary">Наша история</h2>
              <p className="text-secondary/80">
              BakeBay мог бы начаться в 2018 году с вдохновляющей истории про маму, торт и детский праздник, но нет — всё было куда прозаичнее. Никаких слёз, случайностей и магии. Просто идея: упростить заказ домашних десертов без лишнего пафоса и сложностей.


              </p>
              <p className="text-secondary/80">
              Сегодня BakeBay — это сообщество из более чем 500 кондитеров по всей стране. Каждый из них умеет готовить по-настоящему вкусно и делает это по-своему. У нас нет легенды — есть результат. Наша миссия — не сочинять сказки, а делать сладкое доступным, свежим и вовремя. Иногда этого вполне достаточно.
              </p>
              <Button variant="outline" className="group text-secondary border-secondary/30 hover:bg-secondary/5">
                Узнать больше о нас{" "}
                <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/50 to-white/80 -z-10"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-secondary">Как работает BakeBay</h2>
            <p className="text-secondary/80 max-w-2xl mx-auto">
              Получить вкусные, свежеиспеченные угощения с доставкой так же просто, как 1-2-3
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white font-bold flex items-center justify-center mx-auto mb-6 text-2xl">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3 text-secondary">Просмотр и заказ</h3>
              <p className="text-secondary/80">
                Изучите наш выбор тортов, печенья и выпечки от местных кондитеров. Фильтруйте по диетическим
                потребностям, поводу или вкусу.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white font-bold flex items-center justify-center mx-auto mb-6 text-2xl">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3 text-secondary">Кондитер готовит</h3>
              <p className="text-secondary/80">
                Выбранный вами кондитер получает ваш заказ мгновенно и начинает готовить ваши угощения из свежих
                ингредиентов.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white font-bold flex items-center justify-center mx-auto mb-6 text-2xl">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3 text-secondary">Быстрая доставка</h3>
              <p className="text-secondary/80">
                Ваши свежеиспеченные изделия тщательно упаковываются и доставляются к вашей двери, часто в течение
                нескольких часов после заказа.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-accent/50 -z-10"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2 text-secondary">Популярные категории</h2>
              <p className="text-secondary/80">Откройте для себя наши самые любимые сладкие творения</p>
            </div>
            <Button
              variant="outline"
              asChild
              className="mt-4 md:mt-0 text-secondary border-secondary/30 hover:bg-secondary/5"
            >
              <Link href="/catalog">Все категории</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Торты", icon: Cake, count: 120, href: "/catalog?category=Cakes" },
              { name: "Выпечка", icon: Utensils, count: 85, href: "/catalog?category=Pastries" },
              { name: "Печенье", icon: Cookie, count: 64, href: "/catalog?category=Cookies" },
              { name: "Капкейки", icon: Gift, count: 78, href: "/catalog?category=Cupcakes" },
            ].map((category) => (
              <Link key={category.name} href={category.href} className="block">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group">
                  <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <category.icon className="h-16 w-16 text-primary/70 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex justify-between items-center p-6">
                    <div>
                      <h3 className="font-semibold text-secondary">{category.name}</h3>
                      <p className="text-sm text-secondary/90 font-medium">{category.count} товаров</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full text-secondary">
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/70 to-secondary/70 -z-10"></div>
        <div className="absolute inset-0 opacity-5 -z-10">
          <Image src="/placeholder.svg?height=400&width=1600" alt="Фоновый узор" fill className="object-cover" />
        </div>
        <div className="container px-4 md:px-6 text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl p-10 shadow-xl">
            <h2 className="text-3xl font-bold tracking-tight text-secondary mb-4">
              Готовы удовлетворить свою тягу к сладкому?
            </h2>
            <p className="text-secondary/80 text-lg max-w-2xl mx-auto mb-8">
              Присоединяйтесь к тысячам довольных клиентов, которые открыли для себя радость свежих, местных десертов с
              доставкой на дом.
            </p>
            <Button size="lg" className="bg-primary text-white hover:bg-primary/90 transition-all font-medium">
              <Link href="/catalog">Начать просмотр</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
