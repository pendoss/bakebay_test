"use client"

import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star } from "lucide-react"

interface RecentReview {
    review_id: number
    rating: number
    comment: string
    created_at: string
    customer: string
    product: string
}

function initials(name: string) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

export function RecentReviews({ reviews }: { reviews: RecentReview[] }) {
    if (reviews.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">Нет отзывов</p>
    }

    return (
        <div className="space-y-4">
            {reviews.map(review => (
                <div key={review.review_id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-4 mb-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{initials(review.customer)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{review.customer}</p>
                            <p className="text-xs text-muted-foreground truncate">{review.product}</p>
                        </div>
                        <div className="flex">
                            {Array(5).fill(0).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-3.5 w-3.5 ${i < review.rating ? "fill-primary text-primary" : "fill-muted text-muted-foreground"}`}
                                />
                            ))}
                        </div>
                    </div>
                    <p className="text-sm line-clamp-2">{review.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ru })}
                    </p>
                </div>
            ))}
        </div>
    )
}
