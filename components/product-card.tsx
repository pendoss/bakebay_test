'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {Card, CardContent, CardFooter} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {ShoppingCart, Star} from 'lucide-react'
import {useToast} from '@/hooks/use-toast'
import {useCart} from '@/src/adapters/ui/react/providers/cart-provider'
import {asProductId} from '@/src/domain/shared/id'

const dietaryTranslations: { [key: string]: string } = {
    'Gluten-Free': 'Без глютена',
    Vegan: 'Веганское',
    'Dairy-Free': 'Без молочных продуктов',
    'Contains Nuts': 'Содержит орехи',
    'Contains Gluten': 'Содержит глютен',
    'Contains Dairy': 'Содержит молочные продукты',
    'May Contain Nuts': 'Может содержать орехи',
}

interface ProductCardInput {
    id: number
    name: string
    description: string
    price: number
    image?: string
    category: string
    dietary: string[]
    rating: number
    seller: string
    shelfLife?: number | null
    storageConditions?: string | null
    ingredients?: { name: string; amount: number; unit: string }[]
    size?: string | null
}

interface ProductCardProps {
    product: ProductCardInput
}

export function ProductCard({product}: ProductCardProps) {
    const {toast} = useToast()
    const {addItem} = useCart()

    if (!product || typeof product !== 'object') return null

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        addItem({
            productId: asProductId(product.id),
            name: product.name,
            price: product.price,
            image: product.image ?? '/placeholder.svg',
            seller: product.seller,
        })

        toast({
            title: 'Добавлено в корзину',
            description: `${product.name} добавлен в вашу корзину.`,
        })
    }

    return (
        <Link href={`/product?id=${product.id}`} className='block'>
            <Card className='overflow-hidden transition-all duration-200 hover:shadow-md group relative'>
                <div className='aspect-square relative items-end'>
                    <Image src={product.image || '/placeholder.svg'} alt={product.name} fill className='object-cover'/>
                    <div className='absolute bottom-1 left-1 p-2 flex flex-wrap gap-1 transition-opacity'>
                        {product.dietary.slice(0, 2).map((diet, index) => (
                            <Badge key={index} variant='secondary' className='text-xs text-white'>
                                {dietaryTranslations[diet] || diet}
                            </Badge>
                        ))}
                        {product.dietary.length > 2 && (
                            <Badge variant='secondary' className='text-xs text-white'>
                                +{product.dietary.length - 2}
                            </Badge>
                        )}
                    </div>
                </div>
                <CardContent className='p-4 min-h-[160px] flex flex-col justify-between'>
                    <div className='flex justify-between items-start mb-2'>
                        <h3 className='font-semibold text-lg line-clamp-1'>{product.name}</h3>
                    </div>
                    <div>
                        <p className='text-muted-foreground text-sm line-clamp-2 mb-2'>{product.description}</p>
                        <div className='flex items-center gap-1 text-sm mb-1'>
                            <Star className='h-4 w-4 fill-primary text-primary'/>
                            <span>{product.rating}</span>
                        </div>
                        <p className='text-sm text-muted-foreground'>Продавец: {product.seller}</p>
                    </div>
                </CardContent>
                <CardFooter className='p-4 pt-0 pr-6 pb-6 flex justify-between items-center'>
                    <div className='font-semibold'>{product.price.toFixed(2)} руб.</div>
                    <Button
                        size='sm'
                        className='absolute bottom-4 right-4 opacity-100 transition-opacity'
                        onClick={handleAddToCart}
                    >
                        <ShoppingCart className='h-4 w-4 mr-2'/>
                        Добавить
                    </Button>
                </CardFooter>
            </Card>
        </Link>
    )
}
