import { SiteHeader } from "@/components/site-header"
import { CartProvider } from "@/contexts/cart-context"
import "./globals.css"
import {Footer} from "@/components/footer";

interface Props {
    children?: React.ReactNode
}
export default function RootLayout({ children } : Props) {
  return (
    <html lang="ru">
      <body>
        <CartProvider>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
          </div>
        </CartProvider>
        <Footer />
      </body>
    </html>
  )
}


