import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import './MetricsDashboard.css'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

  useEffect(() => {
    loadMetrics()
  }, [])

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

  // Prepare chart data
  const chartData = {
    labels: metrics.map(m => `Instance ${m.iteration}`),
    datasets: [
      {
        label: 'Total LOC',
        data: metrics.map(m => m.loc.total),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.5)',
        tension: 0.3
      },
      {
        label: 'Source LOC',
        data: metrics.map(m => m.loc.src),
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

  const latestMetrics = metrics[metrics.length - 1]

  return (
    <div className="metrics-dashboard">
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Current Iteration</h3>
          <div className="metric-value">{latestMetrics.iteration}</div>
          <div className="metric-label">{latestMetrics.instance}</div>
        </div>

        <div className="metric-card">
          <h3>Total LOC</h3>
          <div className="metric-value">{latestMetrics.loc.total.toLocaleString()}</div>
          <div className="metric-label">Lines of Code</div>
        </div>

        <div className="metric-card">
          <h3>Git Commits</h3>
          <div className="metric-value">{latestMetrics.git.commits}</div>
          <div className="metric-label">Total Commits</div>
        </div>

        <div className="metric-card">
          <h3>TypeScript</h3>
          <div className="metric-value">
            {latestMetrics.typescript_errors === 0 ? '✓' : latestMetrics.typescript_errors}
          </div>
          <div className="metric-label">
            {latestMetrics.typescript_errors === 0 ? 'No Errors' : 'Errors'}
          </div>
        </div>
      </div>

      <div className="chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>

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
