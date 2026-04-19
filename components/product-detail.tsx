'use client'

import React, {useEffect, useMemo, useRef, useState} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {useToast} from '@/hooks/use-toast'
import {useCart} from '@/src/adapters/ui/react/providers/cart-provider'
import {asProductId} from '@/src/domain/shared/id'
import type {Product} from '@/src/domain/product'
import type {ProductReview, ProductSellerInfo} from '@/src/adapters/ui/react/hooks/use-product-detail'
import styles from './product-detail.module.css'

const dietaryTranslations: Record<string, string> = {
    'Gluten-Free': 'Без глютена',
    Vegan: 'Веганское',
    'Dairy-Free': 'Без молочных продуктов',
    'Contains Nuts': 'Содержит орехи',
    'Contains Gluten': 'Содержит глютен',
    'Contains Dairy': 'Содержит молочные продукты',
    'May Contain Nuts': 'Может содержать орехи',
}

interface ProductDetailProps {
    product: Product
    seller: ProductSellerInfo | null
    reviews: ProductReview[]
    related: Product[]
}

function StarSvg() {
    return (
        <svg viewBox='0 0 24 24'>
            <path d='M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17l-6.2 3.3 1.6-6.8L2.2 8.9l6.9-.6z'/>
        </svg>
    )
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return '?'
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function ProductDetail({product, seller, reviews, related}: ProductDetailProps) {
    const {toast} = useToast()
    const {addItem} = useCart()
    const [qty, setQty] = useState(1)
    const [activeImg, setActiveImg] = useState(0)
    const [stickyVisible, setStickyVisible] = useState(false)
    const addBtnRef = useRef<HTMLButtonElement | null>(null)

    useEffect(() => {
        const el = addBtnRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => setStickyVisible(!entry.isIntersecting),
            {rootMargin: '0px 0px -40px 0px'},
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const images = product.images.length > 0
        ? product.images
        : [{
            url: product.mainImage ?? '/placeholder.svg',
            name: product.name,
            isMain: true,
            displayOrder: 0,
            s3Key: null
        }]
    const mainImg = images[activeImg]?.url ?? '/placeholder.svg'

    const sellerName = seller?.seller_name ?? product.seller?.name ?? 'Кондитер'
    const hasReviews = reviews.length > 0
    const avgRating = useMemo(() => {
        if (!hasReviews) return null
        return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    }, [reviews, hasReviews])
    const ratingBuckets = useMemo(() => {
        const buckets = [0, 0, 0, 0, 0]
        reviews.forEach((r) => {
            if (r.rating >= 1 && r.rating <= 5) buckets[5 - r.rating]++
        })
        return buckets
    }, [reviews])

    const sellerYear = seller?.created_at ? new Date(seller.created_at).getFullYear() : null

    const handleAdd = () => {
        for (let i = 0; i < qty; i++) {
            addItem({
                productId: asProductId(product.id),
                name: product.name,
                price: product.price,
                image: product.mainImage ?? '/placeholder.svg',
                seller: sellerName,
            })
        }
        toast({title: 'Добавлено в корзину', description: `${product.name} × ${qty}`})
    }

    return (
        <div className={styles.page}>
            <div className={styles.crumbs}>
                <Link href='/catalog'>Каталог</Link>
                <span className={styles.sep}>/</span>
                {product.category && <><Link
                    href={`/catalog?category=${encodeURIComponent(product.category)}`}>{product.category}</Link><span
                    className={styles.sep}>/</span></>}
                <span className={styles.cur}>{product.name}</span>
            </div>

            <div className={styles.heroWrap}>
                <div className={styles.hero}>
                    <div className={styles.gallery}>
                        <div className={styles.gMain}>
                            <Image src={mainImg} alt={product.name} fill sizes='(max-width: 900px) 100vw, 50vw'
                                   style={{objectFit: 'cover'}}/>
                            {images.length > 1 &&
                                <span className={styles.gThumb}>{activeImg + 1} / {images.length}</span>}
                            {product.dietary.length > 0 && (
                                <div className={styles.gBadges}>
                                    {product.dietary.slice(0, 2).map((d, i) => (
                                        <span key={i} className={styles.badge}>{dietaryTranslations[d] || d}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className={styles.gThumbs}>
                                {images.slice(0, 5).map((img, i) => (
                                    <button key={i} className={i === activeImg ? styles.active : ''}
                                            onClick={() => setActiveImg(i)}>
                                        <Image src={img.url} alt='' width={80} height={80}/>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.info}>
                        <div className={styles.catRow}>
                            <span className={styles.catChip}>{product.category || 'Выпечка'}</span>
                            <span className={styles.ratingChip}>
                {hasReviews ? (
                    <>
                        <StarSvg/>
                        {avgRating!.toFixed(1)} <span className={styles.sub}>({reviews.length} отзывов)</span>
                    </>
                ) : (
                    <span className={styles.sub}>Пока без отзывов</span>
                )}
              </span>
                        </div>

                        <h1 className={styles.title}>{product.name}</h1>
                        <p className={styles.lede}>{product.longDesc || product.shortDesc}</p>

                        {product.dietary.length > 0 && (
                            <div className={styles.dietRow}>
                                {product.dietary.map((d, i) => (
                                    <span key={i} className={styles.diet}>{dietaryTranslations[d] || d}</span>
                                ))}
                            </div>
                        )}

                        {seller && (
                            <Link href={`/catalog?sellerId=${seller.seller_id}`} className={styles.seller}>
                                <span className={styles.av}>{initials(sellerName)}</span>
                                <span className={styles.who}>
                  <b>{sellerName}</b>
                  <span className={styles.meta}>
                    {seller.seller_rating !== null && (
                        <span className={styles.rate}><StarSvg/> {seller.seller_rating.toFixed(1)}</span>
                    )}
                      {seller.location && <><span className={styles.dot}/><span>{seller.location}</span></>}
                      {sellerYear && <><span className={styles.dot}/><span>на bakebay с {sellerYear}</span></>}
                  </span>
                </span>
                                <span className={styles.arr}>
                  <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2'><path
                      d='M5 12h14M13 5l7 7-7 7'/></svg>
                </span>
                            </Link>
                        )}

                        <div className={styles.buyCard}>
                            <div className={styles.priceRow}>
                                <div className={styles.price}>{(product.price * qty).toFixed(2)}<span
                                    className={styles.u}> руб.</span></div>
                                {product.weight && (
                                    <div className={styles.per}>Вес<b>{product.weight} г</b></div>
                                )}
                            </div>

                            <div>
                                <div className={styles.hLab}>Количество</div>
                                <div className={styles.buyActions}>
                                    <div className={styles.qty}>
                                        <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}
                                                aria-label='Уменьшить'>−
                                        </button>
                                        <input value={qty} readOnly/>
                                        <button onClick={() => setQty((q) => q + 1)} aria-label='Увеличить'>+</button>
                                    </div>
                                    <button ref={addBtnRef} className={styles.btn} onClick={handleAdd}>
                                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                            <path d='M3 5h2l2.7 11.4a2 2 0 0 0 2 1.6h7.5a2 2 0 0 0 2-1.6L21 8H6'/>
                                        </svg>
                                        Добавить в корзину
                                    </button>
                                </div>
                            </div>
                        </div>

                        {product.storageConditions && (
                            <div className={styles.trust}>
                                <div className={styles.ic}>
                                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                        <path d='M5 3h14v18H5zM9 7h6M9 11h6M9 15h6'/>
                                    </svg>
                                </div>
                                <div>
                                    <div className={styles.k}>Хранение</div>
                                    <div
                                        className={styles.v}>{product.storageConditions}{product.shelfLife ? ` · ${product.shelfLife} дн.` : ''}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <section>
                <div className={styles.secH}><h2>Детали</h2><span className={styles.bar}/></div>
                <div className={styles.paneGrid}>
                    <div className={styles.box}>
                        <h3>Описание</h3>
                        <p>{product.longDesc || product.shortDesc}</p>
                    </div>
                    <div className={styles.box}>
                        <h3>Характеристики</h3>
                        <div className={styles.kv}>
                            <span className={styles.k}>Категория</span><span
                            className={styles.v}>{product.category || '—'}</span>
                            {product.shelfLife !== null && (<><span className={styles.k}>Срок годности</span><span
                                className={styles.v}>{product.shelfLife} дн.</span></>)}
                            {product.storageConditions && (<><span className={styles.k}>Хранение</span><span
                                className={styles.v}>{product.storageConditions}</span></>)}
                            {product.weight !== null && (<><span className={styles.k}>Вес</span><span
                                className={styles.v}>{product.weight} г</span></>)}
                            {product.size && (<><span className={styles.k}>Размер</span><span
                                className={styles.v}>{product.size}</span></>)}
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div className={styles.secH}><h2>Отзывы</h2><span className={styles.bar}/><span
                    className={styles.count}>{reviews.length} отзывов</span></div>
                <div className={styles.box} style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    padding: 20
                }}>
                    <div className={styles.revHead}>
                        <div className={styles.revBig}>{hasReviews ? avgRating!.toFixed(1) : '—'}<span
                            className={styles.sl}>/5</span></div>
                        <div>
                            <h3>Отзывы покупателей</h3>
                            <p>{hasReviews ? `${reviews.length} отзывов · средняя оценка ${avgRating!.toFixed(1)}` : 'Отзывов пока нет'}</p>
                        </div>
                    </div>
                    {reviews.length > 0 && (
                        <div className={styles.revBars}>
                            {ratingBuckets.map((c, i) => {
                                const pct = reviews.length ? Math.round((c / reviews.length) * 100) : 0
                                return (
                                    <div key={i} className={styles.rb}>
                                        <div className={styles.n}>{5 - i} <StarSvg/></div>
                                        <div className={styles.bar}><i style={{width: `${pct}%`}}/></div>
                                        <div className={styles.c}>{c}</div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    <div className={styles.revList}>
                        {reviews.length === 0 &&
                            <p style={{color: 'hsl(var(--muted-foreground))', fontSize: 14}}>Отзывов пока нет. Будьте
                                первым!</p>}
                        {reviews.map((r) => (
                            <div key={r.id} className={styles.rev}>
                                <div className={styles.hd}>
                                    <span className={styles.av}>{initials(r.customer.name)}</span>
                                    <span
                                        className={styles.nm}>{r.customer.name}<span>{r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    }) : ''}</span></span>
                                    <span
                                        className={styles.stars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                                </div>
                                <div className={styles.t}>{r.comment}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {seller && (
                <section style={{margin: '32px 0'}}>
                    <div className={styles.relatedH}>
                        <h3>Ещё от {sellerName}</h3>
                        <Link href={`/catalog?sellerId=${seller.seller_id}`}>Все позиции →</Link>
                    </div>
                    {related.length > 0 ? (
                        <div className={styles.related}>
                            {related.map((p) => (
                                <Link key={p.id} href={`/product?id=${p.id}`} className={styles.rCard}>
                                    <div className={styles.rPic}>
                                        <Image src={p.mainImage ?? '/placeholder.svg'} alt={p.name} width={240}
                                               height={240}/>
                                    </div>
                                    <div className={styles.rMeta}>
                                        <h5>{p.name}</h5>
                                        <div className={styles.rSell}>{sellerName}</div>
                                        <div className={styles.rFoot}><span
                                            className={styles.rp}>{p.price.toFixed(2)} руб.</span></div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p style={{color: 'hsl(var(--muted-foreground))', fontSize: 14}}>
                            У этого кондитера пока нет других товаров в каталоге.
                        </p>
                    )}
                </section>
            )}

            <div className={`${styles.stickyBuy} ${stickyVisible ? styles.show : ''}`}>
                <Image src={product.mainImage ?? '/placeholder.svg'} alt='' width={40} height={40}/>
                <div className={styles.sInfo}>
                    <b>{product.name}</b>
                    <span>{(product.price * qty).toFixed(2)} руб.{qty > 1 ? ` · ${qty} шт` : ''}</span>
                </div>
                <button className={styles.btn} onClick={handleAdd}>
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                        <path d='M3 5h2l2.7 11.4a2 2 0 0 0 2 1.6h7.5a2 2 0 0 0 2-1.6L21 8H6'/>
                    </svg>
                    В корзину
                </button>
            </div>
        </div>
    )
}

export function ProductNotFound() {
    return (
        <div className={styles.notFound}>
            <div className={styles.notFoundIcon}>
                <svg width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
                    <circle cx='11' cy='11' r='7'/>
                    <path d='m21 21-4.3-4.3'/>
                </svg>
            </div>
            <h1>Кажется, этот десерт уже съели</h1>
            <p>Товар по вашей ссылке больше недоступен — возможно, кондитер убрал его из продажи. Загляните в каталог,
                там много другого вкусного.</p>
            <Link href='/catalog' className={styles.btn} style={{textDecoration: 'none', marginTop: 8}}>Вернуться в
                каталог</Link>
        </div>
    )
}
