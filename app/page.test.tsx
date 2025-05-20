import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import SellersPage from '@/app/sellers/page' // Adjust the import path as needed
import Home from './page'

describe('Home', () => {
  it('renders a heading', () => {
    render(
        <Home />
    )
  });
});