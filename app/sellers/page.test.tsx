import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import SellersPage from '@/app/sellers/page'

jest.mock("next/navigation", () => ({
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

describe('SellersPage', () => {
  it('renders a heading', () => {
    render(<SellersPage />)
 
    const heading = screen.getByRole('heading', { level: 1 })
 
    expect(heading).toBeInTheDocument()
  })
})

