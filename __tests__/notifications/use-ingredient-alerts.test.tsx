import "@testing-library/jest-dom"
import {renderHook} from "@testing-library/react"
import {useIngredientAlerts, AlertableIngredient} from "@/hooks/use-ingredient-alerts"
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

const makeIngredient = (overrides: Partial<AlertableIngredient> = {}): AlertableIngredient => ({
    ingredient_id: 1,
    name: "Мука",
    stock: 10,
    unit: "кг",
    alert: 20,
    status: "ok",
    ...overrides,
})

describe("useIngredientAlerts", () => {
    beforeEach(() => {
        mockNotify.mockClear()
    })

    it("не вызывает уведомления для ингредиентов со статусом ok", () => {
        renderHook(() => useIngredientAlerts([makeIngredient({status: "ok"})]), {wrapper})
        expect(mockNotify).not.toHaveBeenCalled()
    })

    it("вызывает ingredient_low для ингредиентов со статусом low", () => {
        renderHook(
            () => useIngredientAlerts([makeIngredient({status: "low", stock: 5, alert: 10})]),
            {wrapper}
        )
        expect(mockNotify).toHaveBeenCalledWith("ingredient_low", expect.objectContaining({
            title: "Мало ингредиента",
            deeplink: "/seller-dashboard/ingredients",
        }))
    })

    it("вызывает ingredient_out для ингредиентов со статусом out", () => {
        renderHook(
            () => useIngredientAlerts([makeIngredient({status: "out", stock: 0})]),
            {wrapper}
        )
        expect(mockNotify).toHaveBeenCalledWith("ingredient_out", expect.objectContaining({
            title: "Ингредиент закончился",
        }))
    })

    it("не дублирует уведомления при повторном рендере с тем же ингредиентом", () => {
        const ingredients = [makeIngredient({status: "low", stock: 5})]
        const {rerender} = renderHook(
            ({items}) => useIngredientAlerts(items),
            {wrapper, initialProps: {items: ingredients}}
        )
        expect(mockNotify).toHaveBeenCalledTimes(1)

        rerender({items: [...ingredients]})
        expect(mockNotify).toHaveBeenCalledTimes(1)
    })

    it("уведомляет о нескольких ингредиентах", () => {
        const ingredients = [
            makeIngredient({ingredient_id: 1, name: "Мука", status: "low"}),
            makeIngredient({ingredient_id: 2, name: "Сахар", status: "out"}),
            makeIngredient({ingredient_id: 3, name: "Масло", status: "ok"}),
        ]
        renderHook(() => useIngredientAlerts(ingredients), {wrapper})
        expect(mockNotify).toHaveBeenCalledTimes(2)
    })

    it("не вызывает уведомления для пустого массива", () => {
        renderHook(() => useIngredientAlerts([]), {wrapper})
        expect(mockNotify).not.toHaveBeenCalled()
    })
})
