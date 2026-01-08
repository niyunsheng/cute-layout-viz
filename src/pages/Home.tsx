import logo from '../assets/logo.svg'
import '../styles/common.css'

function Home() {
  return (
    <div className="home-container">
      <div className="title-with-logo">
        <img src={logo} alt="Cute Layout Viz Logo" className="title-logo" />
        <h1 className="page-title">Cute Layout Visualizer</h1>
      </div>

      <section className="section">
        <h2 className="section-title">About</h2>
        <p className="section-text">
          An interactive visualization tool for learning and understanding CUTLASS 4.0 Cute Layout
          and related concepts. This project aims to provide visual representations of core CUTLASS
          operations to help developers better understand GPU memory layouts and transformations.
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">Features</h2>
        <ul className="section-list">
          <li><strong className="list-item-title">Basic Operations</strong>
            <ul className="nested-list">
              <li>Layout Visualization</li>
              <li>Composition</li>
              <li>Complement</li>
              <li>Division (Tiling)</li>
              <li>Product (Tiling)</li>
            </ul>
          </li>
          <li className="nested-list-item"><strong className="list-item-title">Advanced Features</strong>
            <ul className="nested-list">
              <li>Bank Conflict Visualization</li>
              <li>More complex operations...</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="section">
        <h2 className="section-title">Development Status</h2>
        <p className="progress-text">
          🚧 This project is currently under active development. Features will be added progressively...
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">Related Resources</h2>
        <ul className="section-list">
          <li>
            <a href="https://github.com/NVIDIA/cutlass" target="_blank" rel="noopener noreferrer">
              CUTLASS GitHub Repository
            </a>
          </li>
          <li>
            <a href="https://docs.nvidia.com/cutlass/latest/media/docs/pythonDSL/overview.html" target="_blank" rel="noopener noreferrer">
              CUTLASS Python DSL Overview
            </a>
          </li>
          <li>
            <a href="https://docs.nvidia.com/cutlass/latest/media/docs/cpp/cute/01_layout.html" target="_blank" rel="noopener noreferrer">
              CuTe Layout Documentation
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}

export default Home
