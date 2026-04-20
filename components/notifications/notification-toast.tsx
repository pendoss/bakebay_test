'use client'

/**
 * NotificationToast — одна карточка уведомления в кондитерской палитре.
 *
 * Дизайн:
 *  — frosted-glass (bg-white/90 + backdrop-blur), мягкая тень;
 *  — вертикальный градиентный акцент слева под severity;
 *  — tinted «чип» с иконкой типа, тот же tone что и акцент;
 *  — inline markdown (**жирный** и `код`) в title/description;
 *  — заголовок + описание + ссылка-действие + крестик dismiss;
 *  — нижний прогресс-бар обратного отсчёта, если duration > 0.
 */

import {
    AlertTriangle,
    type LucideProps,
    MessageSquare,
    Package,
    PackageX,
    RefreshCw,
    ShoppingBag,
    Star,
    X,
} from 'lucide-react'
import {useState, type ComponentType, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent} from 'react'
import {useRouter} from 'next/navigation'
import {AppNotification, NOTIFICATION_CONFIGS, type NotificationType} from '@/lib/notifications'

type Severity = 'info' | 'success' | 'warning' | 'error'

interface SeverityStyle {
    accent: string
    chipText: string
    border: string
    label: string
}

// secondary — mint, accent — blueberry, primary — strawberry; warning — каплями
// янтаря через rgb, чтобы не заводить новый цвет в theme.
const SEVERITY_STYLES: Record<Severity, SeverityStyle> = {
    info: {
        accent: 'bg-accent',
        chipText: 'text-accent',
        border: 'ring-accent/25',
        label: 'info',
    },
    success: {
        accent: 'bg-secondary',
        chipText: 'text-secondary',
        border: 'ring-secondary/25',
        label: 'успех',
    },
    warning: {
        accent: 'bg-[rgb(211,151,88)]',
        chipText: 'text-[rgb(168,108,45)]',
        border: 'ring-[rgb(211,151,88)]/25',
        label: 'внимание',
    },
    error: {
        accent: 'bg-primary',
        chipText: 'text-primary',
        border: 'ring-primary/25',
        label: 'срочно',
    },
}

function severityFor(type: NotificationType): Severity {
    const variant = NOTIFICATION_CONFIGS[type].variant
    if (variant === 'destructive') return 'error'
    if (type === 'ingredient_low') return 'warning'
    if (type === 'new_order' || type === 'new_review') return 'success'
    return 'info'
}

const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
    ShoppingBag,
    Package,
    AlertTriangle,
    PackageX,
    RefreshCw,
    Star,
    MessageSquare,
}

interface Props {
    notification: AppNotification
    onDismiss: (id: string) => void
}

export function NotificationToast({notification, onDismiss}: Props) {
    const router = useRouter()
    const config = NOTIFICATION_CONFIGS[notification.type]
    const severity = severityFor(notification.type)
    const tone = SEVERITY_STYLES[severity]
    const IconComponent = ICON_MAP[config.iconName]
    const [leaving, setLeaving] = useState(false)

    const handleDismiss = () => {
        setLeaving(true)
        window.setTimeout(() => onDismiss(notification.id), 180)
    }

    const handleNavigate = () => {
        if (!notification.deeplink) return
        router.push(notification.deeplink)
        handleDismiss()
    }

    const isInteractive = Boolean(notification.deeplink)
    const onRootClick = isInteractive ? () => handleNavigate() : undefined
    const onRootKey = isInteractive
        ? (e: ReactKeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleNavigate()
            }
        }
        : undefined

    return (
        <div
            role={isInteractive ? 'button' : 'status'}
            tabIndex={isInteractive ? 0 : undefined}
            onClick={onRootClick}
            onKeyDown={onRootKey}
            className={[
                'group relative overflow-hidden rounded-xl bg-white/90 backdrop-blur-md',
                'ring-1 shadow-[0_8px_24px_-12px_rgba(17,15,40,0.25),0_1px_2px_rgba(17,15,40,0.04)]',
                tone.border,
                isInteractive
                    ? 'cursor-pointer hover:-translate-y-[1px] hover:shadow-[0_14px_30px_-14px_rgba(17,15,40,0.35)]'
                    : '',
                'transition-all duration-200 ease-out',
                leaving
                    ? 'opacity-0 translate-x-2'
                    : 'animate-in slide-in-from-right-4 fade-in-0 duration-300',
            ].join(' ')}
        >
            <span
                aria-hidden='true'
                className={`absolute inset-y-2 left-2 w-[3px] rounded-full ${tone.accent} opacity-80`}
            />

            <div className='flex items-start gap-3 pl-5 pr-9 py-3'>
                <span
                    aria-hidden='true'
                    className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ${tone.border} ${tone.chipText} shrink-0`}
                >
                    {IconComponent ? (
                        <IconComponent className='h-4 w-4'/>
                    ) : (
                        <span className='text-xs'>{config.avatarLabel}</span>
                    )}
                </span>

                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                        <p className={`text-[10px] uppercase tracking-[0.12em] font-semibold ${tone.chipText}`}>
                            {tone.label}
                        </p>
                        <span className='text-[10px] text-muted-foreground'>
                            {formatRelative(notification.createdAt)}
                        </span>
                    </div>
                    <p className='text-sm font-semibold leading-snug text-foreground mt-0.5'>
                        {renderInlineMd(notification.title)}
                    </p>
                    {notification.description && (
                        <p className='text-xs leading-snug text-muted-foreground mt-1 line-clamp-3'>
                            {renderInlineMd(notification.description)}
                        </p>
                    )}
                    {notification.deeplink && (
                        <span
                            className={`inline-flex items-center gap-1 text-xs font-medium mt-2 ${tone.chipText}`}
                        >
                            Открыть
                            <span
                                aria-hidden='true'
                                className='transition-transform duration-200 group-hover:translate-x-0.5'
                            >
                                →
                            </span>
                        </span>
                    )}
                </div>
            </div>

            <button
                type='button'
                onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    handleDismiss()
                }}
                className='absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-black/5 hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition'
                aria-label='Закрыть уведомление'
            >
                <X className='h-3.5 w-3.5'/>
            </button>

            {config.duration > 0 && <ProgressBar duration={config.duration} tone={tone.accent}/>}
        </div>
    )
}

function ProgressBar({duration, tone}: {duration: number; tone: string}) {
    return (
        <span
            aria-hidden='true'
            className={`absolute bottom-0 left-0 right-0 h-0.5 origin-left ${tone} opacity-40`}
            style={{animation: `bb-notif-countdown ${duration}ms linear forwards`}}
        />
    )
}

function formatRelative(createdAt: number): string {
    const diff = Date.now() - createdAt
    if (diff < 60_000) return 'только что'
    const minutes = Math.floor(diff / 60_000)
    if (minutes < 60) return `${minutes} мин назад`
    const hours = Math.floor(minutes / 60)
    return `${hours} ч назад`
}

function renderInlineMd(input: string): React.ReactNode {
    const escaped = input.replace(/[<>]/g, (ch) => (ch === '<' ? '\u2039' : '\u203A'))
    const nodes: React.ReactNode[] = []
    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g
    let lastIndex = 0
    let match: RegExpExecArray | null = regex.exec(escaped)
    let key = 0
    while (match !== null) {
        if (match.index > lastIndex) nodes.push(escaped.slice(lastIndex, match.index))
        const chunk = match[0]
        if (chunk.startsWith('**')) {
            nodes.push(
                <strong key={key++} className='font-semibold'>
                    {chunk.slice(2, -2)}
                </strong>,
            )
        } else {
            nodes.push(
                <code
                    key={key++}
                    className='rounded bg-black/5 px-1 py-px text-[11px] font-mono text-foreground/80'
                >
                    {chunk.slice(1, -1)}
                </code>,
            )
        }
        lastIndex = match.index + chunk.length
        match = regex.exec(escaped)
    }
    if (lastIndex < escaped.length) nodes.push(escaped.slice(lastIndex))
    return nodes.length > 0 ? nodes : escaped
}
