import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge', () => {
  it('should render with text content', () => {
    render(<Badge>Active</Badge>)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  describe('variants', () => {
    it('should render default variant', () => {
      render(<Badge>Default</Badge>)

      const badge = screen.getByText('Default')
      expect(badge).toHaveClass('bg-primary')
    })

    it('should render secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>)

      const badge = screen.getByText('Secondary')
      expect(badge).toHaveClass('bg-secondary')
    })

    it('should render destructive variant', () => {
      render(<Badge variant="destructive">Error</Badge>)

      const badge = screen.getByText('Error')
      expect(badge).toHaveClass('bg-destructive')
    })

    it('should render outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>)

      const badge = screen.getByText('Outline')
      expect(badge).toHaveClass('text-foreground')
    })
  })

  it('should apply custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>)

    const badge = screen.getByText('Custom')
    expect(badge).toHaveClass('custom-badge')
  })

  it('should have rounded-full class', () => {
    render(<Badge>Rounded</Badge>)

    const badge = screen.getByText('Rounded')
    expect(badge).toHaveClass('rounded-full')
  })

  it('should apply additional HTML attributes', () => {
    render(<Badge data-testid="test-badge" title="Status">Status</Badge>)

    const badge = screen.getByTestId('test-badge')
    expect(badge).toHaveAttribute('title', 'Status')
  })
})
