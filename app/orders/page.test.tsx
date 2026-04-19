import '@testing-library/jest-dom'
import {render, screen, waitFor} from '@testing-library/react'
import OrdersPage from './page'

// Mock user store selectors
jest.mock('@/src/adapters/ui/react/stores', () => ({
    useCurrentUser: () => ({
        user_id: 2,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@test.com',
        user_role: 'buyer'
    }),
    useSellerId: () => null,
    useIsUserLoading: () => false,
    useIsAuthenticated: () => true,
    useUserActions: () => ({login: jest.fn(), logout: jest.fn(), refreshUser: jest.fn()}),
    useCartItems: () => [],
    useCartTotals: () => ({subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0}),
    useCartCount: () => 0,
    useCartRaw: () => ({items: [], promoCode: null}),
    useCartActions: () => ({
        addItem: jest.fn(),
        removeItem: jest.fn(),
        updateQuantity: jest.fn(),
        clear: jest.fn(),
        applyPromo: jest.fn(),
        setCart: jest.fn()
    }),
}))

// Mock notification hooks
jest.mock('@/hooks/use-order-status-notifications', () => ({
    useOrderStatusNotifications: jest.fn()
}))
jest.mock('@/hooks/use-review-reminder', () => ({
    useReviewReminder: jest.fn()
}))

const fetchMock = jest.fn()
global.fetch = fetchMock

describe('OrdersPage', () => {
    beforeEach(() => {
        fetchMock.mockReset()
        fetchMock.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        })
    })

    it('renders a heading', () => {
        render(<OrdersPage/>)
        expect(screen.getByText('Мои заказы')).toBeInTheDocument()
    })

    it('shows loading state when fetching orders', () => {
        // Make fetch hang so loading stays true
        fetchMock.mockReturnValue(new Promise(() => {
        }))
        render(<OrdersPage/>)
        expect(screen.getByText('Загрузка заказов...')).toBeInTheDocument()
    })

    it('fetches orders from the API', async () => {
        render(<OrdersPage/>)

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(fetchMock).toHaveBeenCalledWith('/api/orders?userId=2')
        })
    })

    it('displays error message when fetch fails', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
        })

        render(<OrdersPage/>)

        await waitFor(() => {
            expect(screen.getByText(/Ошибка загрузки заказов/)).toBeInTheDocument()
        })
    })

    it('renders order tabs correctly', async () => {
        render(<OrdersPage/>)

        await waitFor(() => {
            expect(screen.getByText('Мои заказы')).toBeInTheDocument()
            expect(screen.getByText('Активные')).toBeInTheDocument()
            expect(screen.getByText('Завершенные')).toBeInTheDocument()
        })
    })
})
