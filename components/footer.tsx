import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-secondary text-accent">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-primary">
                <Image src="/placeholder.svg?text=CB" alt="Логотип BakeBay" fill className="object-cover" />
              </div>
              <span className="font-bold text-xl text-white">BakeBay</span>
            </Link>
            <p className="text-accent/80 text-sm">
              Соединяем любителей десертов с талантливыми местными кондитерами для свежих, ручной работы угощений с
              доставкой к вашей двери.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-accent/70 hover:text-accent">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-accent/70 hover:text-accent">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-accent/70 hover:text-accent">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-accent/70 hover:text-accent">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Быстрые ссылки</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/categories" className="text-accent/80 hover:text-accent text-sm">
                  Просмотр категорий
                </Link>
              </li>
              <li>
                <Link href="/sellers" className="text-accent/80 hover:text-accent text-sm">
                  Найти кондитеров
                </Link>
              </li>
              <li>
                <Link href="/deals" className="text-accent/80 hover:text-accent text-sm">
                  Специальные предложения
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-accent/80 hover:text-accent text-sm">
                  О нас
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-accent/80 hover:text-accent text-sm">
                  Блог
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Подпишитесь на нашу рассылку</h3>
            <p className="text-accent/80 text-sm mb-4">
              Будьте в курсе последних новостей, эксклюзивных предложений и вкусных новинок.
            </p>
            <div className="flex flex-col space-y-2">
              <Input
                type="email"
                placeholder="Ваш email"
                className="bg-secondary/80 border-none text-white placeholder:text-accent/60"
              />
              <Button variant="secondary">Подписаться</Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Контакты</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-accent/80 text-sm">
                <MapPin className="h-4 w-4" />
                <span>г. Москва, ул. Тверская, 10</span>
              </li>
              <li className="flex items-center space-x-2 text-accent/80 text-sm">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@BakeBay.ru">info@BakeBay.ru</a>
              </li>
              <li className="flex items-center space-x-2 text-accent/80 text-sm">
                <Phone className="h-4 w-4" />
                <a href="tel:+74951234567">+7 (495) 123-45-67</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-accent/20 mt-8 py-4 text-center text-accent/60 text-sm">
          &copy; {new Date().getFullYear()} BakeBay. Все права защищены.
        </div>
      </div>
    </footer>
  )
}
