import { usePageLoadTime } from '../hooks/usePageLoadTime'

function Layout() {
  usePageLoadTime('Layout')

  return (
    <div className="max-w-6xl p-0 leading-relaxed text-black">
      <h1 className="text-4xl m-0 text-black">Layout</h1>
      <p className="text-xl text-gray-600 mt-4">Coming Soon...</p>
    </div>
  )
}

export default Layout
