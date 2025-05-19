"use client"

import { Separator } from "@/components/ui/separator"
import { SellerDashboardNav } from "@/components/seller-dashboard/seller-nav" // Adjust the import if needed
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
// import { Decode } from "@/app/api/jwt"
import { Loader2 } from "lucide-react"

interface Props {
  children?: React.ReactNode
}

export default function SellerDashboardLayout({ children }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  // const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("auth")
        
        if (!token) {
          console.log("No authentication token found")
          router.push("/")
          return
        }
        
        // // Decode token to check user role

        // console.log("decodiiiing tokin: ",)
        // const userData = Decode(token)
        // console.log("User data:", userData)
        
        // if (userData && userData.role === 'seller') {
        //   console.log("User is a seller, access granted")
        //   setIsAuthorized(true)
        // } else {
        //   console.log("User is not a seller, redirecting to become seller page")
        //   router.push("/sellers?tab=become")
        // }
      } catch (error) {
        console.error("Error checking auth:", error)
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Проверка доступа...</p>
        </div>
      </div>
    )
  }

  // if (!isAuthorized) {
  //   return null // Router will handle redirection, this prevents flash of content
  // }

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
