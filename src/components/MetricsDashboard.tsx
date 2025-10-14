import { useState, useEffect } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import ErrorBoundary from './ErrorBoundary'
import './MetricsDashboard.css'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface Metrics {
  iteration: number
  instance: string
  date: string
  loc: {
    total: number
    src: number
    scripts: number
    tests: number
  }
  files: {
    total: number
    typescript: number
    javascript: number
    markdown: number
  }
  typescript_errors: number
  build_success: boolean
  build_time_ms: number | null
  bundle_size_kb: number | null
  tests?: {
    total: number
    passing: number
    failing: number
    coverage_percent: number | null
  }
  git: {
    commits: number
    files_changed_this_iteration: number
    lines_added_this_iteration: number
    lines_deleted_this_iteration: number
  }
}

function MetricsDashboard() {
  const [metrics, setMetrics] = useState<Metrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIteration, setSelectedIteration] = useState<number | null>(null)

  useEffect(() => {
    loadMetrics()
  }, [])

  // Escape key handler to reset iteration filter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedIteration !== null) {
        setSelectedIteration(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIteration])

  const loadMetrics = async () => {
    try {
      // Use Vite's import.meta.glob to load all metrics files
      const metricsModules = import.meta.glob('../../metrics/*.json')

      const loadedMetrics: Metrics[] = []

      // Load each metrics file
      for (const path in metricsModules) {
        const module = await metricsModules[path]() as { default: Metrics }
        loadedMetrics.push(module.default)
      }

      // Sort by iteration number
      loadedMetrics.sort((a, b) => a.iteration - b.iteration)

      setMetrics(loadedMetrics)
      setLoading(false)
    } catch (err) {
      console.error('Error loading metrics:', err)
      setError('Failed to load metrics')
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading metrics...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  if (metrics.length === 0) {
    return <div className="no-data">No metrics available yet</div>
  }

  // Handle iteration selection
  const handleIterationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedIteration(value === 'all' ? null : Number(value))
  }

  // Filter metrics based on selection
  const filteredMetrics = selectedIteration === null
    ? metrics
    : metrics.filter(m => m.iteration === selectedIteration)

  // Use filteredMetrics for chart data (or single point if specific iteration)
  const displayMetrics = filteredMetrics.length > 0 ? filteredMetrics : metrics

  // Export functions
  const exportToJSON = () => {
    const dataStr = JSON.stringify(displayMetrics, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    const filename = selectedIteration !== null
      ? `sirk-metrics-instance-${selectedIteration}.json`
      : 'sirk-metrics-all.json'
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportToCSV = () => {
    // CSV headers
    const headers = [
      'Iteration',
      'Instance',
      'Date',
      'Total LOC',
      'Source LOC',
      'Scripts LOC',
      'Tests LOC',
      'Total Files',
      'TypeScript Files',
      'JavaScript Files',
      'Markdown Files',
      'TypeScript Errors',
      'Build Success',
      'Build Time (ms)',
      'Bundle Size (KB)',
      'Git Commits',
      'Files Changed',
      'Lines Added',
      'Lines Deleted'
    ]

    // CSV rows
    const rows = displayMetrics.map(m => [
      m.iteration,
      m.instance,
      m.date,
      m.loc.total,
      m.loc.src,
      m.loc.scripts,
      m.loc.tests,
      m.files.total,
      m.files.typescript,
      m.files.javascript,
      m.files.markdown,
      m.typescript_errors,
      m.build_success ? 'true' : 'false',
      m.build_time_ms ?? '',
      m.bundle_size_kb ?? '',
      m.git.commits,
      m.git.files_changed_this_iteration,
      m.git.lines_added_this_iteration,
      m.git.lines_deleted_this_iteration
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Download
    const dataBlob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    const filename = selectedIteration !== null
      ? `sirk-metrics-instance-${selectedIteration}.csv`
      : 'sirk-metrics-all.csv'
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // Prepare chart data
  const chartData = {
    labels: displayMetrics.map(m => `Instance ${m.iteration}`),
    datasets: [
      {
        label: 'Total LOC',
        data: displayMetrics.map(m => m.loc.total),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.5)',
        tension: 0.3
      },
      {
        label: 'Source LOC',
        data: displayMetrics.map(m => m.loc.src),
        borderColor: 'rgb(118, 75, 162)',
        backgroundColor: 'rgba(118, 75, 162, 0.5)',
        tension: 0.3
      }
    ]
  }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Lines of Code Over Iterations'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  // Git Activity Chart Data
  const gitChartData = {
    labels: displayMetrics.map(m => `Instance ${m.iteration}`),
    datasets: [
      {
        label: 'Lines Added',
        data: displayMetrics.map(m => m.git.lines_added_this_iteration),
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        borderColor: 'rgb(76, 175, 80)',
        borderWidth: 1
      },
      {
        label: 'Lines Deleted',
        data: displayMetrics.map(m => -m.git.lines_deleted_this_iteration),
        backgroundColor: 'rgba(244, 67, 54, 0.7)',
        borderColor: 'rgb(244, 67, 54)',
        borderWidth: 1
      }
    ]
  }

  const gitChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Git Activity Per Iteration'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Lines Changed'
        }
      }
    }
  }

  // File Growth Chart Data
  const fileChartData = {
    labels: displayMetrics.map(m => `Instance ${m.iteration}`),
    datasets: [
      {
        label: 'Total Files',
        data: displayMetrics.map(m => m.files.total),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        tension: 0.3
      },
      {
        label: 'TypeScript Files',
        data: displayMetrics.map(m => m.files.typescript),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.3
      }
    ]
  }

  const fileChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'File Count Over Iterations'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Files'
        }
      }
    }
  }

  // Commits Chart Data
  const commitsChartData = {
    labels: displayMetrics.map(m => `Instance ${m.iteration}`),
    datasets: [
      {
        label: 'Total Commits',
        data: displayMetrics.map(m => m.git.commits),
        backgroundColor: 'rgba(156, 39, 176, 0.7)',
        borderColor: 'rgb(156, 39, 176)',
        borderWidth: 1
      }
    ]
  }

  const commitsChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Total Commits Per Iteration'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Commits'
        }
      }
    }
  }

  // Build Time Chart Data
  const buildTimeChartData = {
    labels: displayMetrics.map(m => `Instance ${m.iteration}`),
    datasets: [
      {
        label: 'Build Time (ms)',
        data: displayMetrics.map(m => m.build_time_ms),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.3
      }
    ]
  }

  const buildTimeChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Build Time Over Iterations'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Milliseconds'
        }
      }
    }
  }

  // Bundle Size Chart Data
  const bundleSizeChartData = {
    labels: displayMetrics.map(m => `Instance ${m.iteration}`),
    datasets: [
      {
        label: 'Bundle Size (KB)',
        data: displayMetrics.map(m => m.bundle_size_kb),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3
      }
    ]
  }

  const bundleSizeChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Bundle Size Over Iterations'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Kilobytes (KB)'
        }
      }
    }
  }

  // Test Trends Chart Data
  const testTrendsChartData = {
    labels: displayMetrics.map(m => `Instance ${m.iteration}`),
    datasets: [
      {
        label: 'Total Tests',
        data: displayMetrics.map(m => m.tests?.total ?? 0),
        borderColor: 'rgb(156, 39, 176)',
        backgroundColor: 'rgba(156, 39, 176, 0.5)',
        tension: 0.3
      },
      {
        label: 'Passing Tests',
        data: displayMetrics.map(m => m.tests?.passing ?? 0),
        borderColor: 'rgb(76, 175, 80)',
        backgroundColor: 'rgba(76, 175, 80, 0.5)',
        tension: 0.3
      }
    ]
  }

  const testTrendsChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Test Count Over Iterations'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Tests'
        }
      }
    }
  }

  const latestMetrics = displayMetrics[displayMetrics.length - 1]

  return (
    <div className="metrics-dashboard">
      <div className="dashboard-header">
        <h1>SIRK Lab - Experimental Dashboard</h1>
        <p className="experiment-description">
          Testing whether sequential AI instances can compound improvements through proper handoffs
        </p>
        <div className="deployment-info">
          <span className="deployment-label">Live Deployment:</span>
          <a
            href="https://sirklab.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="deployment-link"
          >
            sirklab.netlify.app
          </a>
        </div>
      </div>

      <div className="iteration-selector-container">
        <label htmlFor="iteration-select" className="iteration-label">
          View Iteration:
        </label>
        <select
          id="iteration-select"
          value={selectedIteration === null ? 'all' : selectedIteration}
          onChange={handleIterationChange}
          className="iteration-select"
          aria-label="Filter dashboard by specific iteration or view all iterations"
        >
          <option value="all">All Iterations</option>
          {metrics.map(m => (
            <option key={m.iteration} value={m.iteration}>
              Instance {m.iteration}
            </option>
          ))}
        </select>
        {selectedIteration !== null && (
          <span className="selection-indicator" role="status" aria-live="polite">
            Showing Instance {selectedIteration} only
          </span>
        )}
      </div>

      <div className="export-controls">
        <button
          onClick={exportToJSON}
          className="export-button"
          aria-label="Export metrics data as JSON file"
        >
          <span className="export-icon" aria-hidden="true">📥</span>
          Export as JSON
        </button>
        <button
          onClick={exportToCSV}
          className="export-button"
          aria-label="Export metrics data as CSV spreadsheet"
        >
          <span className="export-icon" aria-hidden="true">📊</span>
          Export as CSV
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card" role="region" aria-labelledby="current-iteration-heading">
          <h3 id="current-iteration-heading">Current Iteration</h3>
          <div className="metric-value">{latestMetrics.iteration}</div>
          <div className="metric-label">{latestMetrics.instance}</div>
        </div>

        <div className="metric-card" role="region" aria-labelledby="total-loc-heading">
          <h3 id="total-loc-heading">Total LOC</h3>
          <div className="metric-value">{latestMetrics.loc.total.toLocaleString()}</div>
          <div className="metric-label">Lines of Code</div>
        </div>

        <div className="metric-card" role="region" aria-labelledby="git-commits-heading">
          <h3 id="git-commits-heading">Git Commits</h3>
          <div className="metric-value">{latestMetrics.git.commits}</div>
          <div className="metric-label">Total Commits</div>
        </div>

        <div className="metric-card" role="region" aria-labelledby="typescript-heading">
          <h3 id="typescript-heading">TypeScript</h3>
          <div className="metric-value">
            {latestMetrics.typescript_errors === 0 ? '✓' : latestMetrics.typescript_errors}
          </div>
          <div className="metric-label">
            {latestMetrics.typescript_errors === 0 ? 'No Errors' : 'Errors'}
          </div>
        </div>
      </div>

      <ErrorBoundary fallbackMessage="Unable to render LOC chart">
        <div className="chart-container" role="img" aria-label="Line chart showing Lines of Code growth over iterations">
          <Line data={chartData} options={chartOptions} />
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackMessage="Unable to render Git Activity chart">
        <div className="chart-container" role="img" aria-label="Bar chart showing lines added and deleted per iteration">
          <Bar data={gitChartData} options={gitChartOptions} />
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackMessage="Unable to render File Growth chart">
        <div className="chart-container" role="img" aria-label="Line chart showing file count growth over iterations">
          <Line data={fileChartData} options={fileChartOptions} />
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackMessage="Unable to render Commits chart">
        <div className="chart-container" role="img" aria-label="Bar chart showing total commits per iteration">
          <Bar data={commitsChartData} options={commitsChartOptions} />
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackMessage="Unable to render Build Time chart">
        <div className="chart-container" role="img" aria-label="Line chart showing build time over iterations">
          <Line data={buildTimeChartData} options={buildTimeChartOptions} />
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackMessage="Unable to render Bundle Size chart">
        <div className="chart-container" role="img" aria-label="Line chart showing bundle size over iterations">
          <Line data={bundleSizeChartData} options={bundleSizeChartOptions} />
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackMessage="Unable to render Test Trends chart">
        <div className="chart-container" role="img" aria-label="Line chart showing test count progression over iterations">
          <Line data={testTrendsChartData} options={testTrendsChartOptions} />
        </div>
      </ErrorBoundary>

      <div className="metrics-details">
        <h3>Latest Metrics Detail</h3>
        <div className="details-grid">
          <div>
            <strong>Source LOC:</strong> {latestMetrics.loc.src}
          </div>
          <div>
            <strong>Script LOC:</strong> {latestMetrics.loc.scripts}
          </div>
          <div>
            <strong>Test LOC:</strong> {latestMetrics.loc.tests}
          </div>
          <div>
            <strong>TypeScript Files:</strong> {latestMetrics.files.typescript}
          </div>
          <div>
            <strong>Build Status:</strong> {latestMetrics.build_success ? '✅' : '⏳'}
          </div>
          <div>
            <strong>Lines Added:</strong> {latestMetrics.git.lines_added_this_iteration}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetricsDashboard
