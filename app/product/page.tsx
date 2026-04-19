'use client'

import {Suspense} from 'react'
import {useSearchParams} from 'next/navigation'
import {useProductDetail} from '@/src/adapters/ui/react/hooks/use-product-detail'
import {ProductDetail, ProductNotFound} from '@/components/product-detail'

function ProductPageInner() {
    const searchParams = useSearchParams()
    const idParam = searchParams.get('id')
    const id = idParam ? parseInt(idParam, 10) : null

    const {status, product, seller, reviews, related, error} = useProductDetail(id)

    if (status === 'loading') {
        return (
            <div className='text-center py-20'>
                <h3 className='text-lg font-medium'>Загрузка...</h3>
            </div>
        )
    }

    if (status === 'not-found' || !product) {
        return <ProductNotFound/>
    }

    if (status === 'error') {
        return (
            <div className='text-center py-20'>
                <h3 className='text-lg font-medium text-destructive'>Не удалось загрузить товар</h3>
                <p className='text-muted-foreground mt-2'>{error}</p>
            </div>
        )
    }

    return <ProductDetail product={product} seller={seller} reviews={reviews} related={related}/>
}

export default function ProductPage() {
    return (
        <div className='container py-6 px-4 md:px-6'>
            <Suspense fallback={<div className='text-center py-20'>Загрузка...</div>}>
                <ProductPageInner/>
            </Suspense>
        </div>
    )
}
