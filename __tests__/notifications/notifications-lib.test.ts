import {NOTIFICATION_CONFIGS, playSound, NotificationType} from "@/lib/notifications"

describe("NOTIFICATION_CONFIGS", () => {
    const expectedTypes: NotificationType[] = [
        "new_order",
        "new_review",
        "order_status",
        "review_reminder",
        "ingredient_low",
        "ingredient_out",
        "stock_updated",
    ]

    it("содержит конфигурацию для всех типов уведомлений", () => {
        for (const type of expectedTypes) {
            expect(NOTIFICATION_CONFIGS[type]).toBeDefined()
        }
    })

    it("каждая конфигурация имеет обязательные поля", () => {
        for (const type of expectedTypes) {
            const config = NOTIFICATION_CONFIGS[type]
            expect(config).toHaveProperty("sound")
            expect(config).toHaveProperty("duration")
            expect(config).toHaveProperty("variant")
            expect(config).toHaveProperty("iconName")
            expect(config).toHaveProperty("avatarLabel")
            expect(typeof config.duration).toBe("number")
            expect(config.duration).toBeGreaterThanOrEqual(0)
            expect(["default", "destructive"]).toContain(config.variant)
            expect(["ding", "warning", "alert", "none"]).toContain(config.sound)
        }
    })

    it("ingredient_out имеет duration=0 (не закрывается автоматически)", () => {
        expect(NOTIFICATION_CONFIGS.ingredient_out.duration).toBe(0)
    })

    it("ingredient_out имеет destructive variant", () => {
        expect(NOTIFICATION_CONFIGS.ingredient_out.variant).toBe("destructive")
    })

    it("new_review имеет иконку Star", () => {
        expect(NOTIFICATION_CONFIGS.new_review.iconName).toBe("Star")
    })

    it("review_reminder имеет иконку MessageSquare", () => {
        expect(NOTIFICATION_CONFIGS.review_reminder.iconName).toBe("MessageSquare")
    })
})

describe("playSound", () => {
    it("не бросает ошибку для type='none'", () => {
        expect(() => playSound("none")).not.toThrow()
    })

    it("не бросает ошибку при отсутствии AudioContext", () => {
        // jsdom не имеет AudioContext — проверяем что код не ломается
        expect(() => playSound("ding")).not.toThrow()
        expect(() => playSound("warning")).not.toThrow()
        expect(() => playSound("alert")).not.toThrow()
    })
})
