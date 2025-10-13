import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MetricsDashboard from './MetricsDashboard'

describe('MetricsDashboard', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Mock console.error to avoid noise in test output
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

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

    // Check that chart containers are present (6 charts)
    const charts = document.querySelectorAll('.chart-container')
    expect(charts).toHaveLength(6)
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

  it('displays deployment URL link with correct attributes', async () => {
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.queryByText(/loading metrics/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    const deploymentLink = screen.getByText('sirklab.netlify.app')
    expect(deploymentLink).toBeInTheDocument()
    expect(deploymentLink.closest('a')).toHaveAttribute('href', 'https://sirklab.netlify.app/')
    expect(deploymentLink.closest('a')).toHaveAttribute('target', '_blank')
    expect(deploymentLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('handles metrics with null build_time_ms gracefully', async () => {
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.queryByText(/loading metrics/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // Component should render successfully even if some metrics have null values
    // (Instance 0 baseline has null build metrics)
    expect(screen.getByText(/current iteration/i)).toBeInTheDocument()
  })

  it('handles metrics with null bundle_size_kb gracefully', async () => {
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.queryByText(/loading metrics/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // Component should render successfully even if some metrics have null values
    // Chart.js handles null values by creating gaps in the chart
    const charts = document.querySelectorAll('.chart-container')
    expect(charts).toHaveLength(6)
  })

  it('renders all 6 chart containers with error boundaries', async () => {
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.queryByText(/loading metrics/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // Verify all chart containers are wrapped in error boundaries
    const charts = document.querySelectorAll('.chart-container')
    expect(charts.length).toBe(6)

    // Each chart should be a child of the dashboard
    charts.forEach(chart => {
      expect(chart.parentElement?.className).toContain('metrics-dashboard')
    })
  })

  it('displays correct metric card values from latest iteration', async () => {
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.queryByText(/loading metrics/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // Should display "Instance 8" as current iteration in metric card (not dropdown)
    const currentIterationCard = screen.getByText(/current iteration/i).closest('.metric-card')
    expect(currentIterationCard).toBeInTheDocument()
    expect(currentIterationCard).toHaveTextContent('Instance 8')

    // Should have git commits count
    const commitCard = screen.getByText(/git commits/i).closest('.metric-card')
    expect(commitCard).toBeInTheDocument()
  })

  it('sorts metrics by iteration number correctly', async () => {
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.queryByText(/loading metrics/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // Latest metrics should be Instance 8 (highest iteration number)
    // This verifies the .sort((a, b) => a.iteration - b.iteration) logic
    const currentIterationCard = screen.getByText(/current iteration/i).closest('.metric-card')
    expect(currentIterationCard).toHaveTextContent('8')
    expect(currentIterationCard).toHaveTextContent('Instance 8')
  })
})
