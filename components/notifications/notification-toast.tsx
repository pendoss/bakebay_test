"use client"

/**
 * NotificationToast — один блок уведомления.
 *
 * Структура основана на паттерне alert-02 из shadcn Studio:
 *  Alert (variant) → Avatar (иконка типа) + тексты + кнопка закрытия.
 *
 * При наличии deeplink весь блок кликабелен — переход в нужный раздел.
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
    X
} from "lucide-react"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert"
import {Avatar, AvatarFallback} from "@/components/ui/avatar"
import {AppNotification, NOTIFICATION_CONFIGS} from "@/lib/notifications"
import {useRouter} from "next/navigation"
import type {ComponentType} from "react"

// Явный map иконок — tree-shaking вместо import * as LucideIcons (~1500 иконок)
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

    const IconComponent = ICON_MAP[config.iconName]

    const handleClick = () => {
        if (notification.deeplink) {
            router.push(notification.deeplink)
            onDismiss(notification.id)
        }
    }

    return (
        <Alert
            variant={config.variant}
            className={[
                "flex items-center justify-between gap-3 pr-8 relative shadow-md",
                "animate-in slide-in-from-top-4 fade-in-0 duration-300",
                notification.deeplink
                    ? "cursor-pointer hover:brightness-95 transition-[filter]"
                    : "",
            ].join(" ")}
            onClick={notification.deeplink ? handleClick : undefined}
            role={notification.deeplink ? "button" : "alert"}
            tabIndex={notification.deeplink ? 0 : undefined}
            onKeyDown={
                notification.deeplink
                    ? e => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleClick()
                        }
                    }
                    : undefined
            }
        >
            {/* Аватар с иконкой типа уведомления */}
            <Avatar className="h-9 w-9 rounded-md flex-shrink-0">
                <AvatarFallback
                    className={[
                        "rounded-md text-xs",
                        config.variant === "destructive"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-primary/10 text-primary",
                    ].join(" ")}
                >
                    {IconComponent ? (
                        <IconComponent className="h-4 w-4"/>
                    ) : (
                        config.avatarLabel
                    )}
                </AvatarFallback>
            </Avatar>

            {/* Текст */}
            <div className="flex-1 min-w-0">
                <AlertTitle className="text-sm font-semibold leading-snug">
                    {notification.title}
                </AlertTitle>
                <AlertDescription className="text-xs leading-snug mt-0.5 line-clamp-2">
                    {notification.description}
                </AlertDescription>
                {notification.deeplink && (
                    <span className="text-xs text-primary mt-1 inline-block font-medium">
            Нажмите для перехода →
          </span>
                )}
            </div>

            {/* Кнопка закрытия */}
            <button
                type="button"
                onClick={e => {
                    e.stopPropagation()
                    onDismiss(notification.id)
                }}
                className="absolute top-2 right-2 rounded-sm opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Закрыть уведомление"
            >
                <X className="h-3.5 w-3.5"/>
            </button>
        </Alert>
    )
}
