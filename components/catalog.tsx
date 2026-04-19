'use client'

import {useMemo, useState} from 'react'
import {FilterSidebar} from '@/components/filter-sidebar'
import {ProductCard} from '@/components/product-card'
import {Button} from '@/components/ui/button'
import {SlidersHorizontal} from 'lucide-react'
import {cn} from '@/lib/utils'
import {useProducts} from '@/src/adapters/ui/react/hooks/use-products'
import {applyFilters, computePriceRange} from '@/src/domain/product'
import {asSellerId} from '@/src/domain/shared/id'
import type {ProductFilters} from '@/src/domain/product'

type CatalogFilters = {
	priceRange: [number, number]
	categories: string[]
	dietary: string[]
	rating: number
	sellers: number[]
}

interface CatalogProps {
	initialCategory: string | null
	initialFilters?: CatalogFilters | null
}

export function Catalog({initialCategory = null, initialFilters = null}: CatalogProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [filters, setFilters] = useState<CatalogFilters>(
		initialFilters ?? {
			priceRange: [0, 10000] as [number, number],
			categories: initialCategory ? [initialCategory] : [],
			dietary: [],
			rating: 0,
			sellers: [],
		},
	)

	const {products: allProducts, loading, error, refresh} = useProducts({
		categoryName: filters.categories[0] ?? null,
		sellerId: filters.sellers[0] ? asSellerId(filters.sellers[0]) : null,
	})

	const priceRange = useMemo(() => computePriceRange(allProducts), [allProducts])

	const visibleProducts = useMemo(() => {
		const domainFilters: ProductFilters = {
			priceRange: filters.priceRange,
			rating: filters.rating,
			dietary: filters.dietary,
		}
		return applyFilters(allProducts, domainFilters)
	}, [allProducts, filters.priceRange, filters.rating, filters.dietary])

	const applyFiltersAction = (newFilters: CatalogFilters) => {
		setFilters(newFilters)
	}

	return (
		<div className='flex flex-col md:flex-row gap-6'>
			<div className='md:hidden flex justify-end mb-4'>
				<Button variant='outline' onClick={() => setSidebarOpen(!sidebarOpen)}
						className='flex items-center gap-2'>
					<SlidersHorizontal className='h-4 w-4'/>
          Фильтры
				</Button>
			</div>

			<div
				className={cn('fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden', sidebarOpen ? 'block' : 'hidden')}
			>
				<div className='fixed inset-y-0 left-0 w-full max-w-xs bg-background p-6 shadow-lg'>
					<Button variant='ghost' className='absolute right-4 top-4'
							onClick={() => setSidebarOpen(false)}>✕</Button>
					<FilterSidebar
						filters={filters}
						applyFiltersAction={applyFiltersAction}
						minPrice={priceRange[0]}
						maxPrice={priceRange[1]}
					/>
				</div>
			</div>

			<div className='hidden md:block w-64 flex-shrink-0'>
				<FilterSidebar
					filters={filters}
					applyFiltersAction={applyFiltersAction}
					minPrice={priceRange[0]}
					maxPrice={priceRange[1]}
				/>
			</div>

			<div className='flex-1'>
				{loading ? (
					<div className='col-span-full text-center py-12'>
						<h3 className='text-lg font-medium'>Загрузка продуктов...</h3>
						<p className='text-muted-foreground mt-2'>Пожалуйста, подождите</p>
					</div>
				) : error ? (
					<div className='col-span-full text-center py-12'>
						<h3 className='text-lg font-medium text-destructive'>Ошибка загрузки продуктов</h3>
						<p className='text-muted-foreground mt-2'>{error}</p>
						<Button variant='outline' className='mt-4' onClick={refresh}>Попробовать снова</Button>
					</div>
				) : (
					<div
						className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 p-4 relative z-10'>
						{visibleProducts.length > 0 ? (
							visibleProducts.map((product) => (
								<ProductCard
									key={product.id}
									product={{
										id: product.id,
										name: product.name,
										description: product.shortDesc,
										price: product.price,
										image: product.mainImage ?? '/placeholder.svg?height=200&width=200',
										category: product.categoryInfo?.name ?? product.category,
										dietary: product.dietary,
										rating: product.rating,
										seller: product.seller?.name ?? 'Unknown Seller',
										shelfLife: product.shelfLife ?? undefined,
										storageConditions: product.storageConditions || undefined,
										size: product.size ?? undefined,
									}}
								/>
							))
						) : (
							<div className='col-span-full text-center py-12'>
								<h3 className='text-lg font-medium'>Нет товаров, соответствующих вашим фильтрам</h3>
								<p className='text-muted-foreground mt-2'>Попробуйте изменить критерии фильтрации</p>
								<Button
									variant='outline'
									className='mt-4'
									onClick={() => {
										setFilters({
											priceRange,
											categories: [],
											dietary: [],
											rating: 0,
											sellers: [],
										})
										refresh()
									}}
								>
                  Сбросить фильтры
								</Button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
