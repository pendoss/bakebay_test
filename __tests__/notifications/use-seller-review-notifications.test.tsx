import "@testing-library/jest-dom"
import {renderHook, act} from "@testing-library/react"
import {useSellerReviewNotifications} from "@/hooks/use-seller-review-notifications"
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

describe("useSellerReviewNotifications", () => {
    beforeEach(() => {
        jest.useFakeTimers()
        mockNotify.mockClear()
        localStorage.clear()
        global.fetch = jest.fn()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it("не поллит если sellerId = null", () => {
        renderHook(() => useSellerReviewNotifications(null), {wrapper})
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it("инициализирует localStorage при первом запросе без уведомлений", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => [{id: 1}, {id: 2}],
        })

        renderHook(() => useSellerReviewNotifications(5), {wrapper})
        await act(async () => {
            await Promise.resolve()
        })

        expect(mockNotify).not.toHaveBeenCalled()
        const stored = JSON.parse(localStorage.getItem("bb_seller_known_review_ids")!)
        expect(stored).toEqual([1, 2])
    })

    it("уведомляет о новых отзывах при последующих поллах", async () => {
        ;(global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [{id: 1}],
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [{id: 1}, {id: 2}],
            })

        renderHook(() => useSellerReviewNotifications(5), {wrapper})

        // Первый poll — инициализация
        await act(async () => {
            await Promise.resolve()
        })
        expect(mockNotify).not.toHaveBeenCalled()

        // Второй poll через интервал
        await act(async () => {
            jest.advanceTimersByTime(60000)
            await Promise.resolve()
        })

        expect(mockNotify).toHaveBeenCalledWith("new_review", expect.objectContaining({
            title: "Новый отзыв!",
            deeplink: "/seller-dashboard/reviews",
        }))
    })

    it("не уведомляет если нет новых отзывов", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => [{id: 1}],
        })

        renderHook(() => useSellerReviewNotifications(5), {wrapper})

        await act(async () => {
            await Promise.resolve()
        })
        await act(async () => {
            jest.advanceTimersByTime(60000)
            await Promise.resolve()
        })

        expect(mockNotify).not.toHaveBeenCalled()
    })

    it("показывает множественное число для нескольких новых отзывов", async () => {
        ;(global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [{id: 1}],
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [{id: 1}, {id: 2}, {id: 3}],
            })

        renderHook(() => useSellerReviewNotifications(5), {wrapper})

        await act(async () => {
            await Promise.resolve()
        })
        await act(async () => {
            jest.advanceTimersByTime(60000)
            await Promise.resolve()
        })

        expect(mockNotify).toHaveBeenCalledWith("new_review", expect.objectContaining({
            title: "2 новых отзыва!",
        }))
    })

    it("игнорирует ошибки fetch", async () => {
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"))

        renderHook(() => useSellerReviewNotifications(5), {wrapper})
        await act(async () => {
            await Promise.resolve()
        })

        expect(mockNotify).not.toHaveBeenCalled()
    })
})
