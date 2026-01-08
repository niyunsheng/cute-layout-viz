import logo from '../assets/logo.svg'

function Home() {
  return (
    <div className="max-w-6xl p-0 leading-relaxed text-black">

      <div className="flex items-center gap-6 mb-4">
        <img src={logo} alt="Cute Layout Viz Logo" className="h-14 w-auto" />
        <h1 className="text-4xl m-0 text-black">Cute Layout Visualizer</h1>
      </div>

      <section className="mb-8">
        <h2 className="text-3xl mb-2 text-black">About</h2>
        <p className="text-gray-800">
          An interactive visualization tool for learning and understanding CUTLASS 4.0 Cute Layout
          and related concepts. This project aims to provide visual representations of core CUTLASS
          operations to help developers better understand GPU memory layouts and transformations.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-3xl mb-2 text-black">Features TODO List</h2>
        <ul className="pl-8 text-gray-800 list-none">
          <li className="mb-1"><strong className="text-black">Basic Operations</strong>
            <ul className="pl-6 mt-2 list-none">
              <li className="flex items-center gap-2">
                <input type="checkbox" checked disabled className="w-4 h-4" />
                <span>Layout Visualization</span>
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" disabled className="w-4 h-4" />
                <span>Composition</span>
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" disabled className="w-4 h-4" />
                <span>Complement</span>
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" disabled className="w-4 h-4" />
                <span>Division (Tiling)</span>
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" disabled className="w-4 h-4" />
                <span>Product (Tiling)</span>
              </li>
            </ul>
          </li>
          <li className="mt-3"><strong className="text-black">Advanced Features</strong>
            <ul className="pl-6 mt-2 list-none">
              <li className="flex items-center gap-2">
                <input type="checkbox" disabled className="w-4 h-4" />
                <span>Bank Conflict Visualization</span>
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" disabled className="w-4 h-4" />
                <span>More complex operations...</span>
              </li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-3xl mb-2 text-black">Contributing</h2>
        <p className="text-gray-800 mb-3">
          🚧 This project is currently under active development. We welcome contributions from the community!
        </p>
        <ul className="pl-8 text-gray-800">
          <li>⭐ Star the project on <a href="https://github.com/niyunsheng/cute-layout-viz" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">GitHub</a></li>
          <li>🐛 Report bugs or request features via <a href="https://github.com/niyunsheng/cute-layout-viz/issues" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Issues</a></li>
          <li>🔧 Submit Pull Requests to add new features or fix bugs</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-3xl mb-2 text-black">Related Resources</h2>
        <ul className="pl-8 text-gray-800">
          <li>
            <a href="https://github.com/NVIDIA/cutlass" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
              CUTLASS GitHub Repository
            </a>
          </li>
          <li>
            <a href="https://docs.nvidia.com/cutlass/latest/media/docs/pythonDSL/overview.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
              CUTLASS Python DSL Overview
            </a>
          </li>
          <li>
            <a href="https://docs.nvidia.com/cutlass/latest/media/docs/cpp/cute/01_layout.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
              CuTe Layout Documentation
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}

export default Home
