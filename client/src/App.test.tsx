import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByText('인제대학교 와이파이 제보 시스템')).toBeInTheDocument()
  })
})