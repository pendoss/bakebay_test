import "@testing-library/jest-dom"
import {renderHook} from "@testing-library/react"
import {useReviewReminder, DeliveredOrder} from "@/hooks/use-review-reminder"
import {NotificationProvider} from "@/contexts/notification-context"
import type {ReactNode} from "react"

const mockNotify = jest.fn()

jest.mock("@/contexts/notification-context", () => {
    const actual = jest.requireActual("@/contexts/notification-context")
    return {
        ...actual,
        useNotifications: () => ({notify: mockNotify, notifications: [], dismiss: jest.fn(), dismissAll: jest.fn()}),
    }
})

jest.mock("@/lib/notifications", () => {
    const actual = jest.requireActual("@/lib/notifications")
    return {...actual, playSound: jest.fn()}
})

const wrapper = ({children}: { children: ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
)

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

describe("useReviewReminder", () => {
    beforeEach(() => {
        mockNotify.mockClear()
        localStorage.clear()
    })

    it("не уведомляет для пустого списка заказов", () => {
        renderHook(() => useReviewReminder([]), {wrapper})
        expect(mockNotify).not.toHaveBeenCalled()
    })

    it("не уведомляет для заказов не в статусе delivered", () => {
        const orders: DeliveredOrder[] = [
            {id: "1", orderStatus: "processing", date: new Date(Date.now() - TWO_DAYS_MS - 1000).toISOString()},
        ]
        renderHook(() => useReviewReminder(orders), {wrapper})
        expect(mockNotify).not.toHaveBeenCalled()
    })

    it("не уведомляет если доставка была менее 2 дней назад", () => {
        const orders: DeliveredOrder[] = [
            {id: "1", orderStatus: "delivered", date: new Date(Date.now() - 1000 * 60 * 60).toISOString()},
        ]
        renderHook(() => useReviewReminder(orders), {wrapper})
        expect(mockNotify).not.toHaveBeenCalled()
    })

    it("уведомляет если доставка была более 2 дней назад", () => {
        const orders: DeliveredOrder[] = [
            {id: "42", orderStatus: "delivered", date: new Date(Date.now() - TWO_DAYS_MS - 1000).toISOString()},
        ]
        renderHook(() => useReviewReminder(orders), {wrapper})
        expect(mockNotify).toHaveBeenCalledWith("review_reminder", expect.objectContaining({
            title: "Оставьте отзыв по заказу #42",
            deeplink: "/orders",
        }))
    })

    it("не повторяет напоминание для уже показанного заказа", () => {
        localStorage.setItem("bb_review_reminders_shown", JSON.stringify(["42"]))
        const orders: DeliveredOrder[] = [
            {id: "42", orderStatus: "delivered", date: new Date(Date.now() - TWO_DAYS_MS - 1000).toISOString()},
        ]
        renderHook(() => useReviewReminder(orders), {wrapper})
        expect(mockNotify).not.toHaveBeenCalled()
    })

    it("сохраняет показанные ID в localStorage", () => {
        const orders: DeliveredOrder[] = [
            {id: "10", orderStatus: "delivered", date: new Date(Date.now() - TWO_DAYS_MS - 1000).toISOString()},
        ]
        renderHook(() => useReviewReminder(orders), {wrapper})
        const stored = JSON.parse(localStorage.getItem("bb_review_reminders_shown")!)
        expect(stored).toContain("10")
    })

    it("уведомляет о нескольких заказах", () => {
        const orders: DeliveredOrder[] = [
            {id: "1", orderStatus: "delivered", date: new Date(Date.now() - TWO_DAYS_MS - 1000).toISOString()},
            {id: "2", orderStatus: "delivered", date: new Date(Date.now() - TWO_DAYS_MS - 2000).toISOString()},
            {id: "3", orderStatus: "ordering", date: new Date(Date.now() - TWO_DAYS_MS - 3000).toISOString()},
        ]
        renderHook(() => useReviewReminder(orders), {wrapper})
        expect(mockNotify).toHaveBeenCalledTimes(2)
    })

    it("обрабатывает поврежденный localStorage", () => {
        localStorage.setItem("bb_review_reminders_shown", "not-json")
        const orders: DeliveredOrder[] = [
            {id: "1", orderStatus: "delivered", date: new Date(Date.now() - TWO_DAYS_MS - 1000).toISOString()},
        ]
        renderHook(() => useReviewReminder(orders), {wrapper})
        expect(mockNotify).toHaveBeenCalledTimes(1)
    })
})
