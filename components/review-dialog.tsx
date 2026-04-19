'use client'

import {useState} from 'react'
import {useUser} from '@/contexts/user-context'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Star} from 'lucide-react'
import {useToast} from '@/hooks/use-toast'

interface ReviewItem {
    id?: number;
    name: string;
}

interface ReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: ReviewItem[];
}

export function ReviewDialog({open, onOpenChange, items}: ReviewDialogProps) {
    const {isAuthenticated} = useUser()
    const [selectedProductId, setSelectedProductId] = useState<string>(
        items[0]?.id ? String(items[0].id) : ''
    )
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const {toast} = useToast()

    const handleSubmit = async () => {
        if (!selectedProductId || rating === 0 || !comment.trim()) {
            toast({title: 'Заполните все поля', variant: 'destructive'})
            return
        }

        if (!isAuthenticated) {
            toast({title: 'Необходима авторизация', variant: 'destructive'})
            return
        }

        setIsSubmitting(true)
        try {
            const resp = await fetch('/api/reviews', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    product_id: parseInt(selectedProductId),
                    rating,
                    comment,
                }),
            })

            if (!resp.ok) {
                toast({title: 'Ошибка отправки отзыва', variant: 'destructive'})
                return
            }

            toast({title: 'Отзыв отправлен!', description: 'Спасибо за ваш отзыв.'})
            setRating(0)
            setComment('')
            onOpenChange(false)
        } catch {
            toast({title: 'Ошибка отправки отзыва', variant: 'destructive'})
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-md'>
                <DialogHeader>
                    <DialogTitle>Оставить отзыв</DialogTitle>
                    <DialogDescription>Поделитесь вашим мнением о товаре</DialogDescription>
                </DialogHeader>

                <div className='space-y-4 pt-2'>
                    {items.length > 1 && (
                        <div className='space-y-1.5'>
                            <Label>Товар</Label>
                            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                <SelectTrigger>
                                    <SelectValue placeholder='Выберите товар'/>
                                </SelectTrigger>
                                <SelectContent>
                                    {items.filter(i => i.id).map(item => (
                                        <SelectItem key={item.id} value={String(item.id)}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className='space-y-1.5'>
                        <Label>Оценка</Label>
                        <div className='flex gap-1'>
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type='button'
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className='p-0.5'
                                >
                                    <Star
                                        className={`h-7 w-7 transition-colors ${
                                            star <= (hoverRating || rating)
                                                ? 'fill-primary text-primary'
                                                : 'fill-muted text-muted-foreground'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className='space-y-1.5'>
                        <Label>Комментарий</Label>
                        <Textarea
                            placeholder='Расскажите о вашем опыте...'
                            className='min-h-[100px]'
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />
                    </div>

                    <div className='flex gap-2 justify-end'>
                        <Button variant='outline' onClick={() => onOpenChange(false)}>Отмена</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0 || !comment.trim()}>
                            {isSubmitting ? 'Отправка...' : 'Отправить'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
