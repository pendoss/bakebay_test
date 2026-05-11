import '@testing-library/jest-dom'
import {render, screen, waitFor} from '@testing-library/react'
import {Catalog} from './catalog'
import * as React from 'react'

jest.mock('./product-card', () => ({
    ProductCard: jest.fn(({product}: { product: { name: string; price: number } }) => (
        <div data-testid='product-card'>
            <span data-testid='product-name'>{product.name}</span>
            <span data-testid='product-price'>{product.price}</span>
        </div>
    )),
}))

describe('Catalog', () => {
    const mockProductData = [
        {
            id: 1,
            name: 'Chocolate Cake',
            short_desc: 'Delicious chocolate cake',
            price: 15,
            image: '/cake.jpg',
            category: 'Cakes',
            dietary_constraints: [{name: 'Gluten-free'}],
            rating: 4.5,
            seller: {id: 1, name: 'Sweet Bakery', rating: 4.8},
        },
    ]

    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue(mockProductData),
        }) as unknown as typeof fetch
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('renders hero title after initial load', async () => {
        render(<Catalog initialCategory={null}/>)
        await waitFor(() => {
            expect(screen.getByRole('searchbox', {name: /поиск/i})).toBeInTheDocument()
        })
    })

    test('shows empty state when no products match filters', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue([]),
        }) as unknown as typeof fetch

        render(<Catalog initialCategory='Cakes'/>)

        await waitFor(() => {
            expect(screen.getByText('Ничего не подошло')).toBeInTheDocument()
        })
    })

    test('shows error state when fetch fails', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Server Error',
        }) as unknown as typeof fetch

        render(<Catalog initialCategory={null}/>)

        await waitFor(() => {
            expect(screen.getByText('Витрина на замке')).toBeInTheDocument()
        })
    })
})
