'use client'

import {ShoppingCart, Package, List, TrendingUp} from 'lucide-react'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {ErrorBoundary} from './ErrorBoundary'
import {ShoppingListTab} from './shopping-list/ShoppingListTab'
import {ByOrderTab} from './by-order/ByOrderTab'
import {AllIngredientsTab} from './all-ingredients/AllIngredientsTab'
import {OptimizationTab} from './optimization/OptimizationTab'

export default function IngredientsPage() {
	return (
		<div className='space-y-6'>
			<div>
				<h2 className='text-2xl font-bold tracking-tight'>Управление ингредиентами</h2>
				<p className='text-muted-foreground'>
					Отслеживайте ингредиенты, необходимые для ваших ожидающих заказов
				</p>
			</div>

			<Tabs defaultValue='shopping-list' className='w-full'>
				<TabsList className='w-full sm:w-auto grid grid-cols-4 sm:flex'>
					<TabsTrigger value='shopping-list' className='flex items-center gap-2'>
						<ShoppingCart className='h-4 w-4'/>
            Список покупок
					</TabsTrigger>
					<TabsTrigger value='by-order' className='flex items-center gap-2'>
						<Package className='h-4 w-4'/>
            По заказам
					</TabsTrigger>
					<TabsTrigger value='all-ingredients' className='flex items-center gap-2'>
						<List className='h-4 w-4'/>
            Все ингредиенты
					</TabsTrigger>
					<TabsTrigger value='optimization' className='flex items-center gap-2'>
						<TrendingUp className='h-4 w-4'/>
            Оптимизация
					</TabsTrigger>
				</TabsList>

				<TabsContent value='shopping-list' className='mt-4 space-y-4'>
					<ErrorBoundary label='shopping-list'>
						<ShoppingListTab/>
					</ErrorBoundary>
				</TabsContent>

				<TabsContent value='by-order' className='mt-4 space-y-4'>
					<ErrorBoundary label='by-order'>
						<ByOrderTab/>
					</ErrorBoundary>
				</TabsContent>

				<TabsContent value='all-ingredients' className='mt-4'>
					<ErrorBoundary label='all-ingredients'>
						<AllIngredientsTab/>
					</ErrorBoundary>
				</TabsContent>

				<TabsContent value='optimization' className='mt-4 space-y-4'>
					<ErrorBoundary label='optimization'>
						<OptimizationTab/>
					</ErrorBoundary>
				</TabsContent>
			</Tabs>
		</div>
	)
}
