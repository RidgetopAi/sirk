import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

// Component that throws an error on command
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error from component')
  }
  return <div>Child component</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Mock console.error to avoid noise in test output
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test child content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test child content')).toBeInTheDocument()
  })

  it('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // Should show error UI instead of children
    expect(screen.queryByText('Child component')).not.toBeInTheDocument()
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText('⚠️')).toBeInTheDocument()
  })

  it('displays custom fallback message when provided', () => {
    const customMessage = 'Unable to render this chart'

    render(
      <ErrorBoundary fallbackMessage={customMessage}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })

  it('displays default fallback message when not provided', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/something went wrong rendering this component/i)).toBeInTheDocument()
  })

  it('shows error details in collapsible section', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // Check for error details section
    const detailsElement = screen.getByText('Error Details')
    expect(detailsElement).toBeInTheDocument()

    // Check that error message is present in details
    expect(screen.getByText(/Test error from component/)).toBeInTheDocument()
  })

  it('logs error to console via componentDidCatch', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error')

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // componentDidCatch should call console.error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('ErrorBoundary caught an error'),
      expect.any(Error),
      expect.anything()
    )
  })

  it('renders multiple children correctly when no error', () => {
    render(
      <ErrorBoundary>
        <div>First child</div>
        <div>Second child</div>
        <div>Third child</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('First child')).toBeInTheDocument()
    expect(screen.getByText('Second child')).toBeInTheDocument()
    expect(screen.getByText('Third child')).toBeInTheDocument()
  })

  it('maintains error state after error is caught', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // Error UI should be showing
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

    // Rerender should still show error UI (error boundary doesn't reset)
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    // Should still show error UI (boundary is in error state)
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })
})
