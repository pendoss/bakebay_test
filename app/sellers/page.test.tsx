import '@testing-library/jest-dom'
import {render, screen} from '@testing-library/react'
import SellersPage from '@/app/sellers/page'

jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            prefetch: jest.fn()
        };
    },
}));

jest.mock('@/src/adapters/ui/react/stores', () => ({
    useCurrentUser: () => null,
    useSellerId: () => null,
    useIsUserLoading: () => false,
    useIsAuthenticated: () => false,
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

describe('SellersPage', () => {
    it('renders a heading', () => {
        render(<SellersPage/>)

        const heading = screen.getByRole('heading', {level: 1})

        expect(heading).toBeInTheDocument()
    })
})
