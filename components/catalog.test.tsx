import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Catalog } from './catalog';
import * as React from 'react';

// Simplified mocks
jest.mock('./product-card', () => ({
  ProductCard: jest.fn(({ product }) => (
    <div data-testid="product-card">
      <span data-testid="product-name">{product.name}</span>
      <span data-testid="product-price">{product.price}</span>
    </div>
  )),
}));

jest.mock('./filter-sidebar', () => ({
  FilterSidebar: jest.fn(({ filters, applyFiltersAction }) => (
    <div data-testid="filter-sidebar">
      <button 
        data-testid="apply-filter-btn" 
        onClick={() => applyFiltersAction({
          ...filters,
          categories: ['Cookies']
        })}
      >
        Apply Filter
      </button>
    </div>
  )),
}));

jest.mock('./ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
    <button onClick={onClick} data-testid="button">
      {children}
    </button>
  ),
}));

describe('Catalog Component', () => {
  // Setup mock fetch responses
  const mockProductData = [
    {
      id: 1,
      name: 'Chocolate Cake',
      short_desc: 'Delicious chocolate cake',
      price: 15,
      image: '/cake.jpg',
      category: 'Cakes',
      dietary_constraints: [{ name: 'Gluten-free' }],
      rating: 4.5,
      seller: { name: 'Sweet Bakery', rating: 4.8 }
    }
  ];

  beforeEach(() => {
    // Default successful response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockProductData)
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading state when first rendered', () => {
    render(<Catalog initialCategory={null} />);
    
    expect(screen.getByText('Загрузка продуктов...')).toBeInTheDocument;
  });

//   test('displays products when fetch is successful', async () => {
//     render(<Catalog initialCategory={null} />);
    
//     // Wait for loading to finish
//     await waitFor(() => {
//       expect(screen.queryByText('Загрузка продуктов...')).not.toBeInTheDocument;
//     });
    
//     expect(screen.getByTestId('product-card')).toBeInTheDocument;
//   });

  test('shows error message when fetch fails', async () => {
    // Mock error response
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error'
    });

    render(<Catalog initialCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки продуктов')).toBeInTheDocument;
    });
    
    expect(screen.getByText(/Failed to fetch products/)).toBeInTheDocument;
  });


  test('retry button makes a new fetch request', async () => {
    // First response is error
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error'
    });

    render(<Catalog initialCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки продуктов')).toBeInTheDocument;
    });
    
    // Reset fetch mock for next call
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockProductData)
    });
    
    // Click retry button
    fireEvent.click(screen.getByText('Попробовать снова'));
    
    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('reset filters button clears filters and refreshes products', async () => {
    // Mock empty response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue([])
    });

    render(<Catalog initialCategory="Cakes" />);
    
    await waitFor(() => {
      expect(screen.getByText('Нет товаров, соответствующих вашим фильтрам')).toBeInTheDocument;
    });
    
    // Set up mock for second fetch after reset
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockProductData)
    });
    
    // Click reset filters button
    fireEvent.click(screen.getByText('Сбросить фильтры'));
    
    // Verify fetch was called with no category
    expect(global.fetch).toHaveBeenCalledWith('/api/products');
  });

  test('initial category is used in first fetch request', () => {
    render(<Catalog initialCategory="Cakes" />);
    
    // Verify fetch was called with correct category param
    expect(global.fetch).toHaveBeenCalledWith('/api/products?category=Cakes');
  });
});