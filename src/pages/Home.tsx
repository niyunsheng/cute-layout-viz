import logo from '../assets/logo.svg'

function Home() {
  return (
    <div className="max-w-6xl p-0 leading-relaxed text-black">
      {/* GitHub Corner */}
      <a
        href="https://github.com/niyunsheng/cute-layout-viz"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-0 right-0 z-50"
        aria-label="View source on GitHub"
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 250 250"
          className="fill-gray-800 text-white absolute top-0 right-0"
          aria-hidden="true"
        >
          <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
          <path
            d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
            fill="currentColor"
            className="origin-[130px_106px] animate-[octoarm_560ms_ease-in-out]"
          ></path>
          <path
            d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
            fill="currentColor"
          ></path>
        </svg>
      </a>

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
