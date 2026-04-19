'use client'

import {useEffect, useState} from 'react'
import {useUser} from '@/contexts/user-context'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Star} from 'lucide-react'
import {formatDistanceToNow} from 'date-fns'
import {ru} from 'date-fns/locale'

interface Review {
    id: number;
    customer: { name: string; initials: string };
    product: string;
    rating: number;
    created_at: string | Date;
    comment: string;
    replied: boolean;
    seller_reply?: string | null;
    reply_date?: string | Date | null;
}

export default function ReviewsPage() {
    const {sellerId} = useUser()
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [ratingFilter, setRatingFilter] = useState('all')
    const [sortOrder, setSortOrder] = useState('newest')

    useEffect(() => {
        if (!sellerId) return

        const fetchReviews = async () => {
            try {
                const resp = await fetch(`/api/reviews?sellerId=${sellerId}`)
                if (!resp.ok) return
                const data = await resp.json()
                setReviews(data)
            } catch {
                // silently fail
            } finally {
                setLoading(false)
            }
        }

        fetchReviews()
    }, [sellerId])

    const handleReplySubmit = (reviewId: number, replyText: string) => {
        setReviews(prev => prev.map(r =>
            r.id === reviewId
                ? {...r, replied: true, seller_reply: replyText, reply_date: new Date()}
                : r
        ))
    }

    const filtered = reviews
        .filter(r => {
            const q = searchTerm.toLowerCase()
            if (q && !r.product.toLowerCase().includes(q) && !r.customer.name.toLowerCase().includes(q)) return false
            return ratingFilter === 'all' || r.rating === parseInt(ratingFilter)
        })
        .sort((a, b) => {
            switch (sortOrder) {
                case 'newest':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                case 'rating-desc':
                    return b.rating - a.rating
                case 'rating-asc':
                    return a.rating - b.rating
                default:
                    return 0
            }
        })

    if (loading) return <div className='text-center py-10'>Загрузка отзывов...</div>

    return (
        <div className='space-y-6'>
            <div>
                <h2 className='text-2xl font-bold tracking-tight'>Отзывы о товарах</h2>
                <p className='text-muted-foreground'>Управляйте и отвечайте на отзывы клиентов</p>
            </div>

            <div className='flex flex-col sm:flex-row gap-4 items-end justify-between'>
                <div className='grid gap-2 w-full sm:max-w-[360px]'>
                    <Input
                        placeholder='Поиск отзывов по товару или клиенту...'
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className='flex flex-wrap gap-2 w-full sm:w-auto'>
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                        <SelectTrigger className='w-[120px]'>
                            <SelectValue placeholder='Рейтинг'/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='all'>Все рейтинги</SelectItem>
                            <SelectItem value='5'>5 звёзд</SelectItem>
                            <SelectItem value='4'>4 звезды</SelectItem>
                            <SelectItem value='3'>3 звезды</SelectItem>
                            <SelectItem value='2'>2 звезды</SelectItem>
                            <SelectItem value='1'>1 звезда</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className='w-[120px]'>
                            <SelectValue placeholder='Сортировка'/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='newest'>Новые</SelectItem>
                            <SelectItem value='oldest'>Старые</SelectItem>
                            <SelectItem value='rating-desc'>Высокий рейтинг</SelectItem>
                            <SelectItem value='rating-asc'>Низкий рейтинг</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue='all' className='w-full'>
                <TabsList className='w-full sm:w-auto grid grid-cols-3 sm:flex'>
                    <TabsTrigger value='all' className='flex-1 sm:flex-auto'>Все отзывы</TabsTrigger>
                    <TabsTrigger value='pending' className='flex-1 sm:flex-auto'>Ожидают ответа</TabsTrigger>
                    <TabsTrigger value='replied' className='flex-1 sm:flex-auto'>С ответом</TabsTrigger>
                </TabsList>

                <TabsContent value='all' className='mt-4 space-y-4'>
                    {filtered.length === 0
                        ? <p className='text-center text-muted-foreground py-8'>Отзывов нет</p>
                        : filtered.map(r => <ReviewCard key={r.id} review={r} onReply={handleReplySubmit}/>)}
                </TabsContent>

                <TabsContent value='pending' className='mt-4 space-y-4'>
                    {filtered.filter(r => !r.replied).length === 0
                        ? <p className='text-center text-muted-foreground py-8'>Нет отзывов без ответа</p>
                        : filtered.filter(r => !r.replied).map(r => <ReviewCard key={r.id} review={r}
                                                                                onReply={handleReplySubmit}/>)}
                </TabsContent>

                <TabsContent value='replied' className='mt-4 space-y-4'>
                    {filtered.filter(r => r.replied).length === 0
                        ? <p className='text-center text-muted-foreground py-8'>Нет отзывов с ответом</p>
                        : filtered.filter(r => r.replied).map(r => <ReviewCard key={r.id} review={r}
                                                                               onReply={handleReplySubmit}/>)}
                </TabsContent>
            </Tabs>
        </div>
    )
}

function ReviewCard({review, onReply}: { review: Review; onReply: (id: number, text: string) => void }) {
    const [replyText, setReplyText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmitReply = async () => {
        if (!replyText.trim()) return
        setIsSubmitting(true)
        try {
            const resp = await fetch('/api/reviews', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({review_id: review.id, seller_reply: replyText}),
            })
            if (resp.ok) {
                onReply(review.id, replyText)
                setReplyText('')
            }
        } catch (err) {
            console.error('Error submitting reply:', err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader className='pb-3'>
                <div className='flex items-start justify-between gap-4'>
                    <div className='flex items-start gap-3'>
                        <Avatar className='h-9 w-9'>
                            <AvatarFallback>{review.customer.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className='text-base'>{review.customer.name}</CardTitle>
                            <div className='text-sm text-muted-foreground'>
                                {formatDistanceToNow(new Date(review.created_at), {addSuffix: true, locale: ru})}
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col items-end gap-1'>
                        <div className='flex'>
                            {Array(5).fill(0).map((_, i) => (
                                <Star key={i}
                                      className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'fill-muted text-muted-foreground'}`}/>
                            ))}
                        </div>
                        <Badge variant={review.replied ? 'default' : 'outline'}>
                            {review.replied ? 'Есть ответ' : 'Ожидает ответа'}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='space-y-2'>
                    <h4 className='text-sm font-medium'>Товар: {review.product}</h4>
                    <div className='border rounded-lg p-3 bg-muted/50'>
                        <p className='text-sm'>{review.comment}</p>
                    </div>
                </div>

                {review.replied ? (
                    <div className='space-y-2'>
                        <h4 className='text-sm font-medium'>Ваш ответ:</h4>
                        <div className='border rounded-lg p-3'>
                            <p className='text-sm'>{review.seller_reply}</p>
                            {review.reply_date && (
                                <p className='text-xs text-muted-foreground mt-2'>
                        Ответ дан {formatDistanceToNow(new Date(review.reply_date), {addSuffix: true, locale: ru})}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className='space-y-3'>
                        <h4 className='text-sm font-medium'>Ответить на этот отзыв:</h4>
                        <Textarea
                            placeholder='Введите ваш ответ здесь...'
                            className='min-h-[100px]'
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                        />
                        <div className='flex gap-2'>
                            <Button size='sm' onClick={handleSubmitReply} disabled={isSubmitting || !replyText.trim()}>
                                {isSubmitting ? 'Отправка...' : 'Отправить ответ'}
                            </Button>
                            <Button variant='outline' size='sm' onClick={() => setReplyText('')}>
                Очистить
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
