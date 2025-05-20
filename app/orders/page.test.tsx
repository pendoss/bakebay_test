import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import OrdersPage from './page'
import { useState, useEffect } from 'react'

// Mock the React hooks
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useState: jest.fn(),
    useEffect: jest.fn()
}))

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
    removeItem: jest.fn()
}
global.localStorage = localStorageMock as Storage

// Mock fetch
global.fetch = jest.fn()

describe('OrdersPage', () => {
    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks()
        
        // Mock useState
        interface Order {
            id: number;
            userId: number;
            status: string;
            createdAt: string;
            // Add other order properties as needed
        }
        
        const mockOrders: Order[] = []
        const mockLoading = true
        const mockError = null
        const mockSearchTerm = ""
        const mockStatusFilter = "all"
        const mockSortOrder = "newest"
        
        ;(useState as jest.Mock).mockImplementation(initialValue => {
            switch(initialValue) {
                case true: return [mockLoading, jest.fn()]
                case null: return [mockError, jest.fn()]
                case "": return [mockSearchTerm, jest.fn()]
                case "all": return [mockStatusFilter, jest.fn()]
                case "newest": return [mockSortOrder, jest.fn()]
                default: return [mockOrders, jest.fn()]
            }
        })
        
        // Mock useEffect to execute the callback immediately
        ;(useEffect as jest.Mock).mockImplementation(f => f())
        
        // Mock localStorage
        localStorageMock.getItem.mockReturnValue(JSON.stringify({ id: 2 }))
        
        // Mock fetch response
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue([])
        })
    })

    it('renders a heading', () => {
        render(<OrdersPage />)
        expect(screen.getByText('Мои заказы')).toBeInTheDocument()
    })

    it('shows loading state when fetching orders', () => {
        render(<OrdersPage />)
        expect(screen.getByText('Загрузка заказов...')).toBeInTheDocument()
    })
    
    it('fetches orders from the API', async () => {
        render(<OrdersPage />)
        
        expect(global.fetch).toHaveBeenCalledTimes(1)
        expect(global.fetch).toHaveBeenCalledWith('/api/orders?userId=2')
    })
    
    it('displays error message when fetch fails', async () => {
        // Mock fetch to fail
        ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
        
        // Mock useState to return error state
        ;(useState as jest.Mock).mockImplementationOnce(() => [[], jest.fn()])
            .mockImplementationOnce(() => [false, jest.fn()])
            .mockImplementationOnce(() => ['Network error', jest.fn()])
        
        render(<OrdersPage />)
        
        expect(screen.getByText(/Ошибка загрузки заказов/)).toBeInTheDocument()
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
    })
    
    it('renders order tabs correctly', async () => {
        // Update useState mock without resetting it completely
        (useState as jest.Mock).mockImplementation((initialValue) => {
            if (Array.isArray(initialValue)) return [[], jest.fn()]; // orders
            if (initialValue === true) return [false, jest.fn()]; // loading
            if (initialValue === null) return [null, jest.fn()]; // error
            if (initialValue === "") return ["", jest.fn()]; // searchTerm
            if (initialValue === "all") return ["all", jest.fn()]; // statusFilter
            if (initialValue === "newest") return ["newest", jest.fn()]; // sortOrder
            return [initialValue, jest.fn()]; // fallback
        });
        
        render(<OrdersPage />)
        
        expect(screen.getByText('Мои заказы')).toBeInTheDocument()
        expect(screen.getByText('Активные')).toBeInTheDocument()
        expect(screen.getByText('Завершенные')).toBeInTheDocument()
    })
    
})