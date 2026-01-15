import { Routes, Route } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import GitHubCorner from './components/GitHubCorner'
import Home from './pages/Home'

// Lazy load pages that use Pyodide (to avoid loading pyodide on initial page load)
const Layout = lazy(() => import('./pages/Layout'))
const Composition = lazy(() => import('./pages/Composition'))
const Complement = lazy(() => import('./pages/Complement'))
const Division = lazy(() => import('./pages/Division'))
const Product = lazy(() => import('./pages/Product'))
const BankConflict = lazy(() => import('./pages/BankConflict'))

import './App.css'

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Initialize Pyodide on app startup (only once)
  // Use dynamic import to avoid loading pyodide module during initial page load
  useEffect(() => {
    if (!window.__PYODIDE_INIT_STARTED__) {
      window.__PYODIDE_INIT_STARTED__ = true;

      // Dynamic import - load pyodide bridge only when needed
      import('./bridge/pyodide').then(({ initPyodide }) => {
        initPyodide().catch(console.error);
      });
    }
  }, [])

  return (
    <>
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <GitHubCorner />
      <div className={`app-content ${isCollapsed ? 'collapsed' : ''}`}>
        <Suspense fallback={<div className="loading">Loading page...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/layout" element={<Layout />} />
            <Route path="/composition" element={<Composition />} />
            <Route path="/complement" element={<Complement />} />
            <Route path="/division" element={<Division />} />
            <Route path="/product" element={<Product />} />
            <Route path="/bank-conflict" element={<BankConflict />} />
          </Routes>
        </Suspense>
      </div>
    </>
  )
}

export default App
