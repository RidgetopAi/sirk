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

  // Git Activity Chart Data
  const gitChartData = {
    labels: metrics.map(m => `Instance ${m.iteration}`),
    datasets: [
      {
        label: 'Lines Added',
        data: metrics.map(m => m.git.lines_added_this_iteration),
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        borderColor: 'rgb(76, 175, 80)',
        borderWidth: 1
      },
      {
        label: 'Lines Deleted',
        data: metrics.map(m => -m.git.lines_deleted_this_iteration),
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
    labels: metrics.map(m => `Instance ${m.iteration}`),
    datasets: [
      {
        label: 'Total Files',
        data: metrics.map(m => m.files.total),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        tension: 0.3
      },
      {
        label: 'TypeScript Files',
        data: metrics.map(m => m.files.typescript),
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
    labels: metrics.map(m => `Instance ${m.iteration}`),
    datasets: [
      {
        label: 'Total Commits',
        data: metrics.map(m => m.git.commits),
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
    labels: metrics.map(m => `Instance ${m.iteration}`),
    datasets: [
      {
        label: 'Build Time (ms)',
        data: metrics.map(m => m.build_time_ms),
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
    labels: metrics.map(m => `Instance ${m.iteration}`),
    datasets: [
      {
        label: 'Bundle Size (KB)',
        data: metrics.map(m => m.bundle_size_kb),
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

      <div className="chart-container">
        <Bar data={gitChartData} options={gitChartOptions} />
      </div>

      <div className="chart-container">
        <Line data={fileChartData} options={fileChartOptions} />
      </div>

      <div className="chart-container">
        <Bar data={commitsChartData} options={commitsChartOptions} />
      </div>

      <div className="chart-container">
        <Line data={buildTimeChartData} options={buildTimeChartOptions} />
      </div>

      <div className="chart-container">
        <Line data={bundleSizeChartData} options={bundleSizeChartOptions} />
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
