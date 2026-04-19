import "@testing-library/jest-dom"
import {renderHook, act} from "@testing-library/react"
import {useSellerNotifications} from "@/hooks/use-seller-notifications"
import {NotificationProvider} from "@/contexts/notification-context"
import type {ReactNode} from "react"

const mockNotify = jest.fn()
const mockGetOrderIds = jest.fn()

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

jest.mock("@/app/actions/getOrders", () => ({
    getOrderIds: (...args: unknown[]) => mockGetOrderIds(...args),
}))

const wrapper = ({children}: { children: ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
)

describe("useSellerNotifications", () => {
    beforeEach(() => {
        jest.useFakeTimers()
        mockNotify.mockClear()
        mockGetOrderIds.mockClear()
        localStorage.clear()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it("не поллит если sellerId = null", () => {
        renderHook(() => useSellerNotifications(null), {wrapper})
        expect(mockGetOrderIds).not.toHaveBeenCalled()
    })

    it("инициализирует localStorage при первом вызове без уведомлений", async () => {
        mockGetOrderIds.mockResolvedValue({orderIds: [{orderId: 1}, {orderId: 2}]})

        renderHook(() => useSellerNotifications(5), {wrapper})
        await act(async () => {
            await Promise.resolve()
        })

        expect(mockNotify).not.toHaveBeenCalled()
        const stored = JSON.parse(localStorage.getItem("bb_seller_known_order_ids")!)
        expect(stored).toEqual([1, 2])
    })

    it("уведомляет о новых заказах при последующих поллах", async () => {
        mockGetOrderIds
            .mockResolvedValueOnce({orderIds: [{orderId: 1}]})
            .mockResolvedValueOnce({orderIds: [{orderId: 1}, {orderId: 2}]})

        renderHook(() => useSellerNotifications(5), {wrapper})

        // Первый poll — инициализация
        await act(async () => {
            await Promise.resolve()
        })
        expect(mockNotify).not.toHaveBeenCalled()

        // Второй poll через интервал
        await act(async () => {
            jest.advanceTimersByTime(30000)
            await Promise.resolve()
        })

        expect(mockNotify).toHaveBeenCalledWith("new_order", expect.objectContaining({
            title: "Новый заказ #2!",
            deeplink: "/seller-dashboard/orders",
        }))
    })

    it("не уведомляет если нет новых заказов", async () => {
        mockGetOrderIds.mockResolvedValue({orderIds: [{orderId: 1}]})

        renderHook(() => useSellerNotifications(5), {wrapper})

        await act(async () => {
            await Promise.resolve()
        })
        await act(async () => {
            jest.advanceTimersByTime(30000)
            await Promise.resolve()
        })

        expect(mockNotify).not.toHaveBeenCalled()
    })

    it("обрабатывает множественные новые заказы", async () => {
        mockGetOrderIds
            .mockResolvedValueOnce({orderIds: [{orderId: 1}]})
            .mockResolvedValueOnce({orderIds: [{orderId: 1}, {orderId: 2}, {orderId: 3}]})

        renderHook(() => useSellerNotifications(5), {wrapper})

        await act(async () => {
            await Promise.resolve()
        })
        await act(async () => {
            jest.advanceTimersByTime(30000)
            await Promise.resolve()
        })

        expect(mockNotify).toHaveBeenCalledWith("new_order", expect.objectContaining({
            title: "2 новых заказа!",
        }))
    })

    it("игнорирует ошибки при поллинге", async () => {
        mockGetOrderIds.mockRejectedValue(new Error("Network error"))

        renderHook(() => useSellerNotifications(5), {wrapper})
        await act(async () => {
            await Promise.resolve()
        })

        expect(mockNotify).not.toHaveBeenCalled()
    })
})
