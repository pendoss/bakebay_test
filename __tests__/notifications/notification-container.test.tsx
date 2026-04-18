import "@testing-library/jest-dom"
import {render, screen, fireEvent, act} from "@testing-library/react"
import {NotificationProvider, useNotifications} from "@/contexts/notification-context"
import {NotificationContainer} from "@/components/notifications/notification-container"

jest.mock("@/lib/notifications", () => {
    const actual = jest.requireActual("@/lib/notifications")
    return {...actual, playSound: jest.fn()}
})

jest.mock("next/navigation", () => ({
    useRouter: () => ({push: jest.fn()}),
}))

function Trigger() {
    const {notify} = useNotifications()
    return (
        <button
            data-testid="add"
            onClick={() => notify("new_order", {title: "Заказ", description: "Описание", deeplink: "/orders"})}
        />
    )
}

function renderContainer() {
    return render(
        <NotificationProvider>
            <Trigger/>
            <NotificationContainer/>
        </NotificationProvider>
    )
}

describe("NotificationContainer", () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it("не рендерит ничего при пустом списке", () => {
        const {container} = render(
            <NotificationProvider>
                <NotificationContainer/>
            </NotificationProvider>
        )
        expect(container.querySelector("[aria-live]")).toBeNull()
    })

    it("отображает уведомления при их появлении", () => {
        renderContainer()
        act(() => screen.getByTestId("add").click())
        expect(screen.getByText("Заказ")).toBeInTheDocument()
    })

    it("позиционирует контейнер вверху по центру (top + left-1/2 + -translate-x-1/2)", () => {
        renderContainer()
        act(() => screen.getByTestId("add").click())
        const container = screen.getByLabelText("Уведомления")
        expect(container.className).toContain("top-4")
        expect(container.className).toContain("left-1/2")
        expect(container.className).toContain("-translate-x-1/2")
    })

    it("содержит текст для перехода при наличии deeplink", () => {
        renderContainer()
        act(() => screen.getByTestId("add").click())
        expect(screen.getByText("Нажмите для перехода →")).toBeInTheDocument()
    })

    it("позволяет закрыть уведомление кнопкой X", () => {
        renderContainer()
        act(() => screen.getByTestId("add").click())
        expect(screen.getByText("Заказ")).toBeInTheDocument()
        fireEvent.click(screen.getByLabelText("Закрыть уведомление"))
        expect(screen.queryByText("Заказ")).not.toBeInTheDocument()
    })

    it("применяет stacked стиль при множестве уведомлений", () => {
        renderContainer()
        act(() => screen.getByTestId("add").click())
        act(() => screen.getByTestId("add").click())
        act(() => screen.getByTestId("add").click())
        const container = screen.getByLabelText("Уведомления")
        // Должен быть один relative и два absolute элемента (stacked)
        const children = container.querySelector(".relative")!.children
        expect(children.length).toBe(3)
    })

    it("раскрывает уведомления при hover", () => {
        renderContainer()
        act(() => screen.getByTestId("add").click())
        act(() => screen.getByTestId("add").click())
        const container = screen.getByLabelText("Уведомления")
        fireEvent.mouseEnter(container)
        // При hover стили меняются — все элементы получают marginBottom вместо absolute позиционирования
        const wrappers = container.querySelector(".relative")!.children
        for (let i = 0; i < wrappers.length; i++) {
            const el = wrappers[i] as HTMLElement
            // При hover нет position absolute
            expect(el.style.position).not.toBe("absolute")
        }
    })
})
