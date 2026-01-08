import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import GitHubCorner from './components/GitHubCorner'
import Home from './pages/Home'
import Layout from './pages/Layout'
import Composition from './pages/Composition'
import Complement from './pages/Complement'
import Division from './pages/Division'
import Product from './pages/Product'
import BankConflict from './pages/BankConflict'
import './App.css'

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <GitHubCorner />
      <div className={`app-content ${isCollapsed ? 'collapsed' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/layout" element={<Layout />} />
          <Route path="/composition" element={<Composition />} />
          <Route path="/complement" element={<Complement />} />
          <Route path="/division" element={<Division />} />
          <Route path="/product" element={<Product />} />
          <Route path="/bank-conflict" element={<BankConflict />} />
        </Routes>
      </div>
    </>
  )
}

export default App
