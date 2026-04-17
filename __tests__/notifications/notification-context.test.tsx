import "@testing-library/jest-dom"
import {render, screen, act} from "@testing-library/react"
import {NotificationProvider, useNotifications} from "@/contexts/notification-context"
import type {NotificationType} from "@/lib/notifications"

// Мокаем playSound чтобы не вызывать Web Audio API в тестах
jest.mock("@/lib/notifications", () => {
    const actual = jest.requireActual("@/lib/notifications")
    return {...actual, playSound: jest.fn()}
})

function TestConsumer() {
    const {notifications, notify, dismiss, dismissAll} = useNotifications()
    return (
        <div>
            <span data-testid="count">{notifications.length}</span>
            {notifications.map(n => (
                <span key={n.id} data-testid={`notification-${n.type}`}>
          {n.title}
        </span>
            ))}
            <button data-testid="notify-order"
                    onClick={() => notify("new_order", {title: "Новый заказ", description: "desc"})}/>
            <button data-testid="notify-review"
                    onClick={() => notify("new_review", {title: "Новый отзыв", description: "desc"})}/>
            <button data-testid="notify-status"
                    onClick={() => notify("order_status", {title: "Статус", description: "desc"})}/>
            <button data-testid="notify-reminder"
                    onClick={() => notify("review_reminder", {title: "Напоминание", description: "desc"})}/>
            <button data-testid="notify-low"
                    onClick={() => notify("ingredient_low", {title: "Мало", description: "desc"})}/>
            <button data-testid="notify-out"
                    onClick={() => notify("ingredient_out", {title: "Кончился", description: "desc"})}/>
            <button data-testid="dismiss-all" onClick={dismissAll}/>
            {notifications[0] && (
                <button data-testid="dismiss-first" onClick={() => dismiss(notifications[0].id)}/>
            )}
        </div>
    )
}

function renderWithProvider() {
    return render(
        <NotificationProvider>
            <TestConsumer/>
        </NotificationProvider>
    )
}

describe("NotificationContext", () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })
    afterEach(() => {
        jest.useRealTimers()
    })

    it("начинает с пустого списка уведомлений", () => {
        renderWithProvider()
        expect(screen.getByTestId("count").textContent).toBe("0")
    })

    it("добавляет уведомление при вызове notify", () => {
        renderWithProvider()
        act(() => screen.getByTestId("notify-order").click())
        expect(screen.getByTestId("count").textContent).toBe("1")
        expect(screen.getByTestId("notification-new_order")).toHaveTextContent("Новый заказ")
    })

    it("поддерживает все типы уведомлений", () => {
        renderWithProvider()
        const types: [string, NotificationType][] = [
            ["notify-order", "new_order"],
            ["notify-review", "new_review"],
            ["notify-status", "order_status"],
            ["notify-reminder", "review_reminder"],
            ["notify-low", "ingredient_low"],
        ]
        for (const [btnId] of types) {
            act(() => screen.getByTestId(btnId).click())
        }
        expect(screen.getByTestId("count").textContent).toBe("5")
    })

    it("ограничивает максимум 5 видимых уведомлений", () => {
        renderWithProvider()
        for (let i = 0; i < 7; i++) {
            act(() => screen.getByTestId("notify-order").click())
        }
        expect(screen.getByTestId("count").textContent).toBe("5")
    })

    it("dismiss удаляет конкретное уведомление", () => {
        renderWithProvider()
        act(() => screen.getByTestId("notify-order").click())
        expect(screen.getByTestId("count").textContent).toBe("1")
        act(() => screen.getByTestId("dismiss-first").click())
        expect(screen.getByTestId("count").textContent).toBe("0")
    })

    it("dismissAll удаляет все уведомления", () => {
        renderWithProvider()
        act(() => screen.getByTestId("notify-order").click())
        act(() => screen.getByTestId("notify-review").click())
        expect(screen.getByTestId("count").textContent).toBe("2")
        act(() => screen.getByTestId("dismiss-all").click())
        expect(screen.getByTestId("count").textContent).toBe("0")
    })

    it("автоматически закрывает уведомления с ненулевым duration", () => {
        renderWithProvider()
        act(() => screen.getByTestId("notify-order").click()) // duration 8000
        expect(screen.getByTestId("count").textContent).toBe("1")
        act(() => jest.advanceTimersByTime(8100))
        expect(screen.getByTestId("count").textContent).toBe("0")
    })

    it("не автоматически закрывает ingredient_out (duration=0)", () => {
        renderWithProvider()
        act(() => screen.getByTestId("notify-out").click()) // duration 0
        expect(screen.getByTestId("count").textContent).toBe("1")
        act(() => jest.advanceTimersByTime(30000))
        expect(screen.getByTestId("count").textContent).toBe("1")
    })

    it("бросает ошибку если useNotifications вызван вне провайдера", () => {
        // Подавляем console.error от React
        const spy = jest.spyOn(console, "error").mockImplementation(() => {
        })
        expect(() => render(<TestConsumer/>)).toThrow(
            "useNotifications must be used inside NotificationProvider"
        )
        spy.mockRestore()
    })
})
