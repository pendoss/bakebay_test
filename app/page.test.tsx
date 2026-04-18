import '@testing-library/jest-dom'
import {render} from '@testing-library/react'
import Home from './page'

describe('Home', () => {
  it('renders a heading', () => {
    render(
        <Home />
    )
  });
});