import '@testing-library/jest-dom'
import {renderHook} from '@testing-library/react'
import type {ReactNode} from 'react'
import {useIngredientAlerts, type AlertableIngredient} from '@/hooks/use-ingredient-alerts'
import {NotificationProvider} from '@/contexts/notification-context'

const mockNotify = jest.fn()

jest.mock('@/contexts/notification-context', () => {
    const actual = jest.requireActual('@/contexts/notification-context')
    return {
        ...actual,
        useNotifications: () => ({notify: mockNotify, notifications: [], dismiss: jest.fn(), dismissAll: jest.fn()}),
    }
})

jest.mock('@/lib/notifications', () => {
    const actual = jest.requireActual('@/lib/notifications')
    return {...actual, playSound: jest.fn()}
})

const wrapper = ({children}: {children: ReactNode}) => <NotificationProvider>{children}</NotificationProvider>

const makeIngredient = (overrides: Partial<AlertableIngredient> = {}): AlertableIngredient => ({
    ingredient_id: 1,
    name: 'Мука',
    stock: 10,
    unit: 'кг',
    alert: 20,
    status: 'ok',
    ...overrides,
})

describe('useIngredientAlerts', () => {
    beforeEach(() => {
        mockNotify.mockClear()
        // Обнуляем модульный Map между тестами
        jest.resetModules()
    })

    it('первый рендер только фиксирует baseline, не уведомляет даже для low/out', () => {
        renderHook(
            () =>
                useIngredientAlerts([
                    makeIngredient({ingredient_id: 1, status: 'low', stock: 5}),
                    makeIngredient({ingredient_id: 2, status: 'out', stock: 0}),
                ]),
            {wrapper},
        )
        expect(mockNotify).not.toHaveBeenCalled()
    })

    it('уведомляет только при переходе ok → low', () => {
        const items = [makeIngredient({ingredient_id: 3, status: 'ok', stock: 10})]
        const {rerender} = renderHook(({data}) => useIngredientAlerts(data), {
            wrapper,
            initialProps: {data: items},
        })
        expect(mockNotify).not.toHaveBeenCalled()

        rerender({data: [{...items[0], status: 'low', stock: 4}]})
        expect(mockNotify).toHaveBeenCalledWith(
            'ingredient_low',
            expect.objectContaining({title: 'Мало ингредиента'}),
        )
    })

    it('уведомляет при переходе в out (даже если прежний статус был low)', () => {
        const items = [makeIngredient({ingredient_id: 4, status: 'ok', stock: 10})]
        const {rerender} = renderHook(({data}) => useIngredientAlerts(data), {
            wrapper,
            initialProps: {data: items},
        })
        rerender({data: [{...items[0], status: 'low', stock: 4}]})
        mockNotify.mockClear()
        rerender({data: [{...items[0], status: 'out', stock: 0}]})
        expect(mockNotify).toHaveBeenCalledWith(
            'ingredient_out',
            expect.objectContaining({title: 'Ингредиент закончился'}),
        )
    })

    it('не дублирует при повторных рендерах без смены статуса', () => {
        const items = [makeIngredient({ingredient_id: 5, status: 'ok'})]
        const {rerender} = renderHook(({data}) => useIngredientAlerts(data), {
            wrapper,
            initialProps: {data: items},
        })
        rerender({data: [{...items[0], status: 'low', stock: 4}]})
        expect(mockNotify).toHaveBeenCalledTimes(1)
        rerender({data: [{...items[0], status: 'low', stock: 3}]})
        rerender({data: [{...items[0], status: 'low', stock: 2}]})
        expect(mockNotify).toHaveBeenCalledTimes(1)
    })

    it('не вызывает для пустого массива', () => {
        renderHook(() => useIngredientAlerts([]), {wrapper})
        expect(mockNotify).not.toHaveBeenCalled()
    })
})
