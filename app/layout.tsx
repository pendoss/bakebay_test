import { SiteHeader } from "@/components/site-header"
import { CartProvider } from "@/contexts/cart-context"
import {UserProvider} from "@/contexts/user-context"
import "./globals.css"
import {Footer} from "@/components/footer";
import {Toaster} from "@/components/ui/toaster";

interface Props {
    children?: React.ReactNode
}
export default function RootLayout({ children } : Props) {
  return (
    <html lang="ru">
      <body>
      <UserProvider>
        <CartProvider>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader/>
            <div className="flex-1">{children}</div>
          </div>
        </CartProvider>
        <Footer/>
        <Toaster/>
      </UserProvider>
      </body>
    </html>
  )
}


