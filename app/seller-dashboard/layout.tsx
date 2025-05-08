import { SellerDashboardNav } from "@/components/seller-dashboard/seller-nav"
import { Separator } from "@/components/ui/separator"

interface Props {
  children?: React.ReactNode
}
export default function SellerDashboardLayout({ children } : Props) {
  return (
    <div className="container py-8 px-4 md:px-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Панель продавца</h1>
          <p className="text-muted-foreground">Управляйте своими товарами, заказами и взаимодействием с клиентами</p>
        </div>
        <Separator />
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-1/5">
            <SellerDashboardNav />
          </aside>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}
