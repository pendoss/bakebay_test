import "@testing-library/jest-dom"
import {renderHook} from "@testing-library/react"
import {useOrderStatusNotifications, TrackedOrder} from "@/hooks/use-order-status-notifications"
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

jest.mock("@/lib/constants/orderStatus", () => ({
    ORDER_STATUS_LABELS: {
        ordering: "Оформляется",
        processing: "В обработке",
        delivered: "Доставлен",
    },
}))

const wrapper = ({children}: { children: ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
)

describe("useOrderStatusNotifications", () => {
    beforeEach(() => {
        mockNotify.mockClear()
    })

    it("не уведомляет при первой загрузке (инициализация)", () => {
        const orders: TrackedOrder[] = [
            {id: "1", orderStatus: "ordering"},
            {id: "2", orderStatus: "processing"},
        ]
        renderHook(() => useOrderStatusNotifications(orders), {wrapper})
        expect(mockNotify).not.toHaveBeenCalled()
    })

    it("уведомляет при изменении статуса заказа", () => {
        const initial: TrackedOrder[] = [{id: "1", orderStatus: "ordering"}]
        const updated: TrackedOrder[] = [{id: "1", orderStatus: "processing"}]

        const {rerender} = renderHook(
            ({orders}) => useOrderStatusNotifications(orders),
            {wrapper, initialProps: {orders: initial}}
        )

        rerender({orders: updated})
        expect(mockNotify).toHaveBeenCalledWith("order_status", expect.objectContaining({
            title: "Статус заказа #1 обновлён",
            description: "Новый статус: В обработке.",
            deeplink: "/orders",
        }))
    })

    it("не уведомляет если статус не изменился", () => {
        const orders: TrackedOrder[] = [{id: "1", orderStatus: "ordering"}]

        const {rerender} = renderHook(
            ({orders: o}) => useOrderStatusNotifications(o),
            {wrapper, initialProps: {orders}}
        )

        rerender({orders: [...orders]})
        expect(mockNotify).not.toHaveBeenCalled()
    })

    it("уведомляет о нескольких изменениях одновременно", () => {
        const initial: TrackedOrder[] = [
            {id: "1", orderStatus: "ordering"},
            {id: "2", orderStatus: "ordering"},
        ]
        const updated: TrackedOrder[] = [
            {id: "1", orderStatus: "delivered"},
            {id: "2", orderStatus: "processing"},
        ]

        const {rerender} = renderHook(
            ({orders}) => useOrderStatusNotifications(orders),
            {wrapper, initialProps: {orders: initial}}
        )

        rerender({orders: updated})
        expect(mockNotify).toHaveBeenCalledTimes(2)
    })

    it("не вызывает уведомления для пустого массива", () => {
        renderHook(() => useOrderStatusNotifications([]), {wrapper})
        expect(mockNotify).not.toHaveBeenCalled()
    })

    it("не уведомляет о новых заказах (только об изменениях существующих)", () => {
        const initial: TrackedOrder[] = [{id: "1", orderStatus: "ordering"}]
        const updated: TrackedOrder[] = [
            {id: "1", orderStatus: "ordering"},
            {id: "2", orderStatus: "processing"},
        ]

        const {rerender} = renderHook(
            ({orders}) => useOrderStatusNotifications(orders),
            {wrapper, initialProps: {orders: initial}}
        )

        rerender({orders: updated})
        // Только id "2" — новый, не уведомляем (prev === undefined)
        expect(mockNotify).not.toHaveBeenCalled()
    })
})
