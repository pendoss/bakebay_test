/**
 * Система уведомлений BakeBay
 *
 * Типы, конфигурация и генератор звуков через Web Audio API.
 * Звуки создаются программно — внешние аудиофайлы не нужны.
 */

export type NotificationType =
    | "new_order"        // продавец: пришёл новый заказ
    | "new_review"       // продавец: получен новый отзыв
    | "order_status"     // покупатель: статус заказа изменился
    | "review_reminder"  // покупатель: напоминание оставить отзыв
    | "ingredient_low"   // продавец: ингредиент приближается к лимиту
    | "ingredient_out"   // продавец: ингредиент закончился
    | "stock_updated"    // продавец: остаток ингредиента обновлён

export interface AppNotification {
    id: string
    type: NotificationType
    title: string
    description: string
    deeplink?: string
    createdAt: number
}

export interface NotificationConfig {
    sound: "ding" | "warning" | "alert" | "none"
    duration: number      // мс до автозакрытия; 0 = не закрывать
    variant: "default" | "destructive"
    iconName: string      // имя иконки из lucide-react
    avatarLabel: string   // 2 буквы для AvatarFallback
}

export const NOTIFICATION_CONFIGS: Record<NotificationType, NotificationConfig> = {
    new_order: {
        sound: "ding",
        duration: 8000,
        variant: "default",
        iconName: "ShoppingBag",
        avatarLabel: "ЗК",
    },
    new_review: {
        sound: "ding",
        duration: 8000,
        variant: "default",
        iconName: "Star",
        avatarLabel: "ОТ",
    },
    order_status: {
        sound: "ding",
        duration: 7000,
        variant: "default",
        iconName: "Package",
        avatarLabel: "СТ",
    },
    review_reminder: {
        sound: "ding",
        duration: 10000,
        variant: "default",
        iconName: "MessageSquare",
        avatarLabel: "ОТ",
    },
    ingredient_low: {
        sound: "warning",
        duration: 12000,
        variant: "default",
        iconName: "AlertTriangle",
        avatarLabel: "⚠",
    },
    ingredient_out: {
        sound: "alert",
        duration: 0,       // не закрывать автоматически — критично
        variant: "destructive",
        iconName: "PackageX",
        avatarLabel: "✕",
    },
    // TODO: использовать при ручном обновлении остатков в addIngredient action
    stock_updated: {
        sound: "none",
        duration: 4000,
        variant: "default",
        iconName: "RefreshCw",
        avatarLabel: "↻",
    },
}

/**
 * playSound — генерирует звук через Web Audio API.
 *
 * ding    — два коротких высоких тона (новый заказ, смена статуса)
 * warning — три средних пульсирующих тона (мало ингредиента)
 * alert   — нисходящий аккорд из трёх нот (критический уровень)
 */
export function playSound(type: "ding" | "warning" | "alert" | "none"): void {
    if (type === "none" || typeof window === "undefined") return

    try {
        const AudioCtx =
            window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AudioCtx) return

        const ctx = new AudioCtx()

        const tone = (freq: number, startSec: number, durSec: number, vol = 0.25) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "sine"
            osc.frequency.value = freq
            gain.gain.setValueAtTime(vol, ctx.currentTime + startSec)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startSec + durSec)
            osc.start(ctx.currentTime + startSec)
            osc.stop(ctx.currentTime + startSec + durSec + 0.05)
        }

        switch (type) {
            case "ding":
                // A5 → C6: приятный двойной звонок
                tone(880, 0.00, 0.12)
                tone(1047, 0.12, 0.18)
                break
            case "warning":
                // D4 × 3 с паузами: предупреждение
                tone(294, 0.00, 0.15)
                tone(294, 0.20, 0.15)
                tone(294, 0.40, 0.22, 0.3)
                break
            case "alert":
                // E4 → C#4 → B3: нисходящий тревожный сигнал
                tone(330, 0.00, 0.14, 0.35)
                tone(277, 0.18, 0.14, 0.35)
                tone(247, 0.36, 0.28, 0.35)
                break
        }
    } catch {
        // Web Audio API недоступен — игнорируем
    }
}
