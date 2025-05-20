import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MainNav } from './main-nav'

// Мокаем next/link
jest.mock('next/link', () => {
  return ({ href, children }: any) => <a href={href}>{children}</a>
})

describe('MainNav', () => {
  it('renders all static routes', () => {
    render(<MainNav />)

    expect(screen.getByText('Главная')).toBeInTheDocument()
    expect(screen.getByText('Все товары')).toBeInTheDocument()
    expect(screen.getByText('Кондитеры')).toBeInTheDocument()
  })

  it('renders dropdown trigger for categories', () => {
    render(<MainNav />)

    const dropdownTrigger = screen.getByText('Категории')
    expect(dropdownTrigger).toBeInTheDocument
  })

  it('applies custom className', () => {
    render(<MainNav className="test-class" />)

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('test-class')
  })

  it('spreads additional props to nav', () => {
    render(<MainNav data-testid="main-nav" />)

    expect(screen.getByTestId('main-nav')).toBeInTheDocument()
  })
})