import {formatDistanceToNow} from 'date-fns'
import {ru} from 'date-fns/locale'

export function formatPrice(v: number): string {
    return v.toLocaleString('ru-RU') + ' ₽'
}

export function formatDate(d: string | Date): string {
    return formatDistanceToNow(new Date(d), {addSuffix: true, locale: ru})
}

export function getInitials(fullName: string): string {
    return fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function formatAmount(v: number, unit: string): string {
    return `${v.toFixed(2)} ${unit}`
}
