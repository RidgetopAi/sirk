import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MetricsDashboard from './MetricsDashboard'

describe('MetricsDashboard', () => {
  it('renders without crashing', () => {
    render(<MetricsDashboard />)
    expect(screen.getByText(/loading metrics/i)).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<MetricsDashboard />)
    expect(screen.getByText(/loading metrics/i)).toBeInTheDocument()
  })

  it('displays dashboard with real metrics from file system', async () => {
    render(<MetricsDashboard />)

    // Wait for metrics to load from actual JSON files
    await waitFor(() => {
      expect(screen.queryByText(/loading metrics/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // Check that all 4 metric cards are displayed
    expect(screen.getByText(/current iteration/i)).toBeInTheDocument()
    expect(screen.getByText(/total loc/i)).toBeInTheDocument()
    expect(screen.getByText(/git commits/i)).toBeInTheDocument()
    expect(screen.getByText(/no errors/i)).toBeInTheDocument()
  })

  it('renders chart containers when metrics are loaded', async () => {
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.queryByText(/loading metrics/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // Check that chart containers are present (4 charts)
    const charts = document.querySelectorAll('.chart-container')
    expect(charts).toHaveLength(4)
  })

  it('displays metrics details grid', async () => {
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.queryByText(/loading metrics/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // Check details grid
    expect(screen.getByText(/latest metrics detail/i)).toBeInTheDocument()
    expect(screen.getByText(/source loc:/i)).toBeInTheDocument()
    expect(screen.getByText(/script loc:/i)).toBeInTheDocument()
    expect(screen.getByText(/build status:/i)).toBeInTheDocument()
  })
})
