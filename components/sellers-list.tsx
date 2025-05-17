"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

interface Seller {
  seller_id: number;
  seller_name: string;
  seller_rating: number;
  description: string;
  location: string;
  website?: string;
  contact_name: string;
  contact_email: string;
  contact_number: string;
  inn?: string;
  about_products?: string;
  user_id?: number;
  // Derived fields (not in DB but calculated for display)
  productsCount?: number;
  joinedDate?: string;
  specialties?: string[];
  image?: string;
}

export function SellersList() {
  const router = useRouter()
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/sellers')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sellers: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log(data)
        
        const formattedSellers = data.map((seller: Seller) => ({
          ...seller,
          // Format created_at timestamp to a readable date if available, or use placeholder
          joinedDate: formatJoinedDate(seller.created_at) || "Неизвестно",
          image: "/placeholder.svg?height=300&width=300",
          specialties: getSpecialties(seller),
          productsCount: 0 // Will be updated after fetching product counts
        }))
        
        // Get product counts for each seller
        for (const seller of formattedSellers) {
          try {
            const countResponse = await fetch(`/api/products/count?sellerId=${seller.seller_id}`)
            if (countResponse.ok) {
              const { count } = await countResponse.json()
              seller.productsCount = count
            }
          } catch (error) {
            console.error(`Failed to fetch product count for seller ${seller.seller_id}:`, error)
          }
        }
        
        setSellers(formattedSellers)
      } catch (error) {
        console.error("Error fetching sellers:", error)
        setError(error instanceof Error ? error.message : "Failed to load sellers")
      } finally {
        setLoading(false)
      }
    }
    
    fetchSellers()
  }, [])

  // Helper function to format date
  const formatJoinedDate = (timestamp?: number) => {
    if (!timestamp) return "Недавно"
    
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long'
    })
  }
  
  // Helper function to generate specialties based on seller data
  const getSpecialties = (seller: Seller) => {
    const specialties = []
    
    if (seller.about_products) {
      // Extract keywords from about_products
      const keywords = seller.about_products.toLowerCase()
      
      if (keywords.includes("торт")) specialties.push("Торты")
      if (keywords.includes("печенье")) specialties.push("Печенье")
      if (keywords.includes("пирог")) specialties.push("Пироги")
      if (keywords.includes("органич")) specialties.push("Органик")
      if (keywords.includes("веган")) specialties.push("Веганское")
      if (keywords.includes("безглютен")) specialties.push("Без глютена")
    }
    
    // If no specialties detected, add a default one based on location
    if (specialties.length === 0) {
      specialties.push(`Кондитерские изделия`)
    }
    
    return specialties
  }

  const handleViewProducts = (sellerId: number, sellerName: string) => {
    // Navigate to catalog page with seller filter
    router.push(`/catalog?seller=${encodeURIComponent(sellerName)}&sellerId=${sellerId}`)
  }

  // Show loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <Card key={index} className="overflow-hidden">
            <Skeleton className="aspect-[3/2] w-full" />
            <CardHeader className="min-h-[150px]">
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-full mt-1" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  // Show error message
  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Не удалось загрузить продавцов</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Попробовать снова</Button>
      </div>
    )
  }

  // Show empty state
  if (sellers.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Продавцы не найдены</h3>
        <p className="text-muted-foreground mb-4">На данный момент в нашем маркетплейсе нет продавцов.</p>
        <Button onClick={() => router.push('/sellers?tab=become')}>Стать первым продавцом</Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sellers.map((seller) => (
        <Card key={seller.seller_id} className="overflow-hidden">
          <div className="aspect-[3/2] relative">
            <Image src={seller.image || "/placeholder.svg"} alt={seller.seller_name} fill className="object-cover" />
          </div>
          <CardHeader className="min-h-[150px]">
            <div className="flex justify-between items-start">
              <CardTitle>{seller.seller_name}</CardTitle>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-medium">{seller.seller_rating?.toFixed(1) || "Новый"}</span>
              </div>
            </div>
            <CardDescription>{seller.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Местоположение:</span>
                <span>{seller.location}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Товары:</span>
                <span>{seller.productsCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Присоединился:</span>
                <span>{seller.joinedDate}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {seller.specialties?.map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => handleViewProducts(seller.seller_id, seller.seller_name)}
            >
              Посмотреть товары
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
