import "./App.css";
import MetricsDashboard from "./components/MetricsDashboard";

function App() {
  return (
    <div className="App">
      <header>
        <h1>Brian Dashboard</h1>
        <p className="subtitle">
          Single Instance Recursive Knowledge Experiment
        </p>
      </header>

      <main>
        <MetricsDashboard />
      </main>

      <footer>
        <p>
          Testing whether sequential AI instances can compound improvements
          through proper context handoffs
        </p>
      </footer>
    </div>
  );
}

export default App;
