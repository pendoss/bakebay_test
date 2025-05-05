import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SellersList } from "@/components/sellers-list"
import { BecomeSellerForm } from "@/components/become-seller-form"

export default function SellersPage() {
  return (
    <div className="container py-10 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Наши продавцы</h1>
          <p className="text-muted-foreground">Откройте для себя наш отобранный выбор мастеров-кондитеров</p>
        </div>
        <div className="w-full md:w-auto">
          <Input placeholder="Поиск продавцов..." className="md:w-[250px]" />
        </div>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="browse">Просмотр продавцов</TabsTrigger>
          <TabsTrigger value="become">Стать продавцом</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <SellersList />
        </TabsContent>

        <TabsContent value="become">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Присоединяйтесь к нашему маркетплейсу</h2>
              <p className="text-muted-foreground">
                Поделитесь своими сладкими творениями с нашим сообществом и развивайте свой бизнес
              </p>
            </div>
            <BecomeSellerForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
