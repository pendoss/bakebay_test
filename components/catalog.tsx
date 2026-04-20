'use client'

import * as React from 'react'
import {useMemo, useState} from 'react'
import {ChevronDown, Search, Sparkles, X} from 'lucide-react'
import {cn} from '@/lib/utils'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Slider} from '@/components/ui/slider'
import {ProductCard} from '@/components/product-card'
import {useProducts} from '@/src/adapters/ui/react/hooks/use-products'
import {useProductSearch, type ProductSearchHit} from '@/src/adapters/ui/react/hooks/use-product-search'
import {applyFilters, computePriceRange, type Product} from '@/src/domain/product'
import type {ProductFilters} from '@/src/domain/product'

type CatalogState = {
    priceRange: [number, number]
    category: string | null
    dietary: string[]
    sort: 'featured' | 'price_asc' | 'price_desc'
}

const QUICK_CATEGORIES: ReadonlyArray<{ value: string | null; label: string }> = [
    {value: null, label: 'Всё'},
    {value: 'Cakes', label: 'Торты'},
    {value: 'Cupcakes', label: 'Капкейки'},
    {value: 'Cookies', label: 'Печенье'},
    {value: 'Pastries', label: 'Выпечка'},
    {value: 'Tarts', label: 'Тарты'},
    {value: 'Chocolates', label: 'Шоколад'},
    {value: 'Italian Desserts', label: 'Итальянские'},
    {value: 'Brownies', label: 'Брауни'},
]

const DIETARY: ReadonlyArray<{ value: string; label: string }> = [
    {value: 'Vegan', label: 'Веганское'},
    {value: 'Gluten-Free', label: 'Без глютена'},
    {value: 'Dairy-Free', label: 'Без молока'},
    {value: 'Contains Nuts', label: 'С орехами'},
]

const SORT_LABEL: Record<CatalogState['sort'], string> = {
    featured: 'Рекомендуемые',
    price_asc: 'Дешевле сначала',
    price_desc: 'Дороже сначала',
}

interface CatalogProps {
    initialCategory: string | null
    initialFilters?: {
        priceRange: [number, number]
        categories: string[]
        dietary: string[]
    } | null
    initialSearch?: string
}

function toCardProduct(product: Product) {
    return {
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
        isCustomizable: product.isCustomizable,
    }
}

export function Catalog({initialCategory = null, initialFilters = null, initialSearch = ''}: CatalogProps) {
    const [searchQuery, setSearchQuery] = useState(initialSearch)
    const [state, setState] = useState<CatalogState>({
        priceRange: initialFilters?.priceRange ?? [0, 10000],
        category: initialCategory ?? initialFilters?.categories?.[0] ?? null,
        dietary: initialFilters?.dietary ?? [],
        sort: 'featured',
    })

    const isSearching = searchQuery.trim().length > 0
    const {payload: searchPayload, loading: searchLoading, error: searchError} = useProductSearch(searchQuery)
    const {products: allProducts, loading, error, refresh} = useProducts({
        categoryName: state.category,
        sellerId: null,
    })

    const priceBounds = useMemo(() => computePriceRange(allProducts), [allProducts])

    const visibleProducts = useMemo(() => {
        const f: ProductFilters = {priceRange: state.priceRange, dietary: state.dietary}
        const filtered = applyFilters(allProducts, f)
        const sorted = [...filtered]
        if (state.sort === 'price_asc') sorted.sort((a, b) => a.price - b.price)
        if (state.sort === 'price_desc') sorted.sort((a, b) => b.price - a.price)
        return sorted
    }, [allProducts, state.priceRange, state.dietary, state.sort])

    const activeFilterCount =
        (state.dietary.length > 0 ? 1 : 0) +
        (state.priceRange[0] !== priceBounds[0] || state.priceRange[1] !== priceBounds[1] ? 1 : 0)

    const resetFilters = () => {
        setState((s) => ({...s, priceRange: priceBounds, dietary: [], sort: 'featured'}))
    }

    return (
        <div className='space-y-6'>
            <div className='relative'>
                <Search
                    className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none'/>
                <Input
                    type='search'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Найти: медовик, макаруны, свадебный торт…'
                    className='pl-9 pr-10 h-11 text-base'
                    aria-label='Поиск товара'
                />
                {searchQuery.length > 0 && (
                    <button
                        type='button'
                        onClick={() => setSearchQuery('')}
                        className='absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground'
                        aria-label='Очистить'
                    >
                        <X className='h-4 w-4'/>
                    </button>
                )}
            </div>

            <CategoryStrip active={state.category} onPick={(c) => setState((s) => ({...s, category: c}))}/>

            <FilterBar
                state={state}
                priceBounds={priceBounds}
                activeCount={activeFilterCount}
                onPriceChange={(p) => setState((s) => ({...s, priceRange: p}))}
                onDietaryToggle={(v) =>
                    setState((s) => ({
                        ...s,
                        dietary: s.dietary.includes(v) ? s.dietary.filter((x) => x !== v) : [...s.dietary, v],
                    }))
                }
                onSort={(v) => setState((s) => ({...s, sort: v}))}
                onReset={resetFilters}
            />

            <section>
                {isSearching ? (
                    <SearchResults
                        query={searchQuery.trim()}
                        loading={searchLoading}
                        error={searchError}
                        results={searchPayload?.results ?? []}
                        suggestions={searchPayload?.suggestions ?? []}
                        onClear={() => setSearchQuery('')}
                        onPickSuggestion={(name) => setSearchQuery(name)}
                    />
                ) : loading ? (
                    <SkeletonGrid/>
                ) : error ? (
                    <EmptyState
                        title='Витрина на замке'
                        body={error}
                        cta={<Button variant='outline' onClick={refresh}>Попробовать снова</Button>}
                    />
                ) : visibleProducts.length === 0 ? (
                    <EmptyState
                        title='Ничего не подошло'
                        body='Попробуйте расширить цену или убрать диетические ограничения.'
                        cta={<Button onClick={resetFilters}>Сбросить фильтры</Button>}
                    />
                ) : (
                    <div className='space-y-4'>
                        <ResultsHeader count={visibleProducts.length} sort={state.sort}/>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5'>
                            {visibleProducts.map((p) => (
                                <ProductCard key={p.id} product={toCardProduct(p)}/>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}

function CategoryStrip({active, onPick}: { active: string | null; onPick: (v: string | null) => void }) {
    return (
        <nav aria-label='Категории' className='-mx-4 md:mx-0 overflow-x-auto'>
            <div className='flex gap-2 px-4 md:px-0 pb-1 min-w-max md:flex-wrap'>
                {QUICK_CATEGORIES.map((c) => {
                    const isOn = c.value === active
                    return (
                        <button
                            key={c.label}
                            type='button'
                            onClick={() => onPick(c.value)}
                            className={cn(
                                'inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors min-h-[36px]',
                                isOn
                                    ? 'bg-secondary text-white border-secondary'
                                    : 'bg-background border-lavender-dessert/60 text-secondary hover:border-secondary',
                            )}
                        >
                            {c.label}
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}

function FilterBar({
                       state,
                       priceBounds,
                       activeCount,
                       onPriceChange,
                       onDietaryToggle,
                       onSort,
                       onReset,
                   }: {
    state: CatalogState
    priceBounds: [number, number]
    activeCount: number
    onPriceChange: (p: [number, number]) => void
    onDietaryToggle: (v: string) => void
    onSort: (v: CatalogState['sort']) => void
    onReset: () => void
}) {
    const priceLabel =
        state.priceRange[0] === priceBounds[0] && state.priceRange[1] === priceBounds[1]
            ? 'Цена'
            : `${state.priceRange[0]}–${state.priceRange[1]} ₽`
    const dietLabel = state.dietary.length > 0 ? `Диеты · ${state.dietary.length}` : 'Диеты'
    const isPriceActive = priceLabel !== 'Цена'
    const isDietActive = state.dietary.length > 0
    const isSortActive = state.sort !== 'featured'

    return (
        <div className='flex flex-wrap items-center gap-2'>
            <Popover>
                <PopoverTrigger asChild>
                    <FilterPill active={isPriceActive} label={priceLabel}/>
                </PopoverTrigger>
                <PopoverContent align='start' className='w-72'>
                    <div className='text-sm font-medium mb-3'>Бюджет</div>
                    <div className='flex items-baseline justify-between text-sm font-medium mb-2'>
                        <span>{state.priceRange[0]} ₽</span>
                        <span className='text-muted-foreground'>—</span>
                        <span>{state.priceRange[1]} ₽</span>
                    </div>
                    <Slider
                        min={priceBounds[0]}
                        max={priceBounds[1]}
                        step={50}
                        value={state.priceRange}
                        onValueChange={(v) => onPriceChange([v[0], v[1]] as [number, number])}
                    />
                </PopoverContent>
            </Popover>

            <Popover>
                <PopoverTrigger asChild>
                    <FilterPill active={isDietActive} label={dietLabel}/>
                </PopoverTrigger>
                <PopoverContent align='start' className='w-64'>
                    <div className='text-sm font-medium mb-3'>Диеты и ограничения</div>
                    <div className='grid grid-cols-2 gap-2'>
                        {DIETARY.map((d) => {
                            const on = state.dietary.includes(d.value)
                            return (
                                <button
                                    key={d.value}
                                    type='button'
                                    onClick={() => onDietaryToggle(d.value)}
                                    className={cn(
                                        'rounded-md border px-3 py-2 text-sm text-left transition-colors',
                                        on
                                            ? 'bg-secondary text-white border-secondary'
                                            : 'bg-background border-border hover:border-secondary',
                                    )}
                                >
                                    {on && <span aria-hidden>✓ </span>}
                                    {d.label}
                                </button>
                            )
                        })}
                    </div>
                </PopoverContent>
            </Popover>

            <Popover>
                <PopoverTrigger asChild>
                    <FilterPill active={isSortActive} label={SORT_LABEL[state.sort]}/>
                </PopoverTrigger>
                <PopoverContent align='end' className='w-56'>
                    <div className='text-sm font-medium mb-2'>Сортировка</div>
                    <div className='grid gap-0.5'>
                        {(Object.keys(SORT_LABEL) as CatalogState['sort'][]).map((k) => (
                            <button
                                key={k}
                                type='button'
                                onClick={() => onSort(k)}
                                className={cn(
                                    'flex items-center gap-2 rounded-md px-2 py-2 text-sm text-left transition-colors',
                                    state.sort === k ? 'bg-muted font-medium' : 'hover:bg-muted/60',
                                )}
                            >
                                <span
                                    className={cn(
                                        'h-3 w-3 rounded-full border',
                                        state.sort === k ? 'bg-secondary border-secondary' : 'border-muted-foreground/40',
                                    )}
                                    aria-hidden
                                />
                                {SORT_LABEL[k]}
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {activeCount > 0 && (
                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={onReset}
                    className='ml-auto text-muted-foreground hover:text-foreground'
                >
                    Сбросить
                </Button>
            )}
        </div>
    )
}

type FilterPillProps = { active: boolean; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>
const FilterPill = React.forwardRef<HTMLButtonElement, FilterPillProps>(function FilterPill(
    {active, label, className, ...rest},
    ref,
) {
    return (
        <button
            ref={ref}
            type='button'
            {...rest}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors min-h-[36px]',
                active
                    ? 'bg-secondary text-white border-secondary'
                    : 'bg-background border-border hover:border-secondary',
                className,
            )}
        >
            <span>{label}</span>
            <ChevronDown className='h-3.5 w-3.5 opacity-70'/>
        </button>
    )
})

function ResultsHeader({count, sort}: { count: number; sort: CatalogState['sort'] }) {
    const word =
        count % 10 === 1 && count % 100 !== 11
            ? 'товар'
            : [2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)
                ? 'товара'
                : 'товаров'
    return (
        <div className='flex items-baseline justify-between text-sm'>
            <span className='text-muted-foreground'>
                <span className='font-medium text-foreground'>{count}</span> {word}
            </span>
            <span className='text-muted-foreground'>{SORT_LABEL[sort]}</span>
        </div>
    )
}

function EmptyState({title, body, cta}: { title: string; body: string; cta?: React.ReactNode }) {
    return (
        <div className='mx-auto max-w-md text-center py-16 px-6 space-y-3'>
            <div
                className='mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                <Sparkles className='h-5 w-5'/>
            </div>
            <h3 className='text-lg font-semibold'>{title}</h3>
            <p className='text-sm text-muted-foreground'>{body}</p>
            {cta}
        </div>
    )
}

function SkeletonGrid() {
    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5'>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className='rounded-lg border border-border bg-background p-3 animate-pulse'>
                    <div className='aspect-square rounded-md bg-muted'/>
                    <div className='h-4 mt-3 rounded bg-muted w-3/4'/>
                    <div className='h-3 mt-2 rounded bg-muted/70 w-1/3'/>
                </div>
            ))}
        </div>
    )
}

function SearchResults({
                           query,
                           loading,
                           error,
                           results,
                           suggestions,
                           onClear,
                           onPickSuggestion,
                       }: {
    query: string
    loading: boolean
    error: string | null
    results: ReadonlyArray<ProductSearchHit>
    suggestions: ReadonlyArray<ProductSearchHit>
    onClear: () => void
    onPickSuggestion: (name: string) => void
}) {
    if (loading && results.length === 0) {
        return <div className='py-12 text-center text-sm text-muted-foreground'>Ищем «{query}»…</div>
    }
    if (error) {
        return (
            <EmptyState
                title='Поиск не удался'
                body={error}
                cta={<Button variant='outline' onClick={onClear}>Очистить</Button>}
            />
        )
    }
    if (results.length === 0 && suggestions.length === 0) {
        return (
            <EmptyState
                title={`Ничего не нашли по «${query}»`}
                body='Попробуйте другое слово — «шоколад», «безе», «ягоды» — или очистите поиск.'
                cta={<Button variant='outline' onClick={onClear}>Очистить</Button>}
            />
        )
    }
    return (
        <div className='space-y-6'>
            {results.length > 0 && (
                <div className='space-y-4'>
                    <div className='flex items-baseline justify-between text-sm'>
                        <span className='text-muted-foreground'>
                            <span className='font-medium text-foreground'>{results.length}</span> по «{query}»
                        </span>
                        <Button variant='ghost' size='sm' onClick={onClear}>
                            Очистить
                        </Button>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5'>
                        {results.map((hit) => (
                            <ProductCard key={hit.product.id} product={toCardProduct(hit.product)}/>
                        ))}
                    </div>
                </div>
            )}

            {suggestions.length > 0 && (
                <section className='rounded-lg border border-dashed border-border p-4 space-y-3'>
                    <div className='text-sm font-medium'>Возможно, вы искали</div>
                    <div className='flex flex-wrap gap-2'>
                        {suggestions.map((hit) => (
                            <button
                                key={hit.product.id}
                                type='button'
                                className='rounded-full border px-3 py-1 text-sm hover:bg-muted'
                                onClick={() => onPickSuggestion(hit.product.name)}
                            >
                                {hit.product.name}
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
