import { Link, useLocation } from 'react-router-dom'

interface NavbarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

function Navbar({ isCollapsed, setIsCollapsed }: NavbarProps) {
  const location = useLocation()

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: isCollapsed ? '0' : '250px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e0e0e0',
    transition: 'width 0.3s ease',
    overflow: 'hidden',
    zIndex: 1000
  }

  const headerStyle: React.CSSProperties = {
    padding: '1.5rem 1rem',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '1.2rem',
    fontWeight: 600,
    color: '#000',
    whiteSpace: 'nowrap'
  }

  const navLinksStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem 0',
    overflowY: 'auto',
    height: 'calc(100vh - 80px)'
  }

  const sectionTitleStyle: React.CSSProperties = {
    padding: '0.5rem 1.5rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '0.5rem'
  }

  const linkStyle: React.CSSProperties = {
    color: '#666',
    textDecoration: 'none',
    padding: '0.75rem 1.5rem',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    borderLeft: '3px solid transparent'
  }

  const activeLinkStyle: React.CSSProperties = {
    ...linkStyle,
    color: '#000',
    backgroundColor: '#f5f5f5',
    borderLeft: '3px solid #646cff'
  }

  const toggleButtonStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: isCollapsed ? '0' : '250px',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '60px',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderLeft: isCollapsed ? '1px solid #e0e0e0' : 'none',
    borderRadius: isCollapsed ? '0 4px 4px 0' : '0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'left 0.3s ease',
    zIndex: 1001,
    color: '#666',
    fontSize: '0.8rem',
    padding: 0
  }

  return (
    <>
      <aside style={sidebarStyle}>
        <div style={headerStyle}>Cute Layout Viz</div>
        <nav style={navLinksStyle}>
          <Link
            to="/"
            style={location.pathname === '/' ? activeLinkStyle : linkStyle}
          >
            Home
          </Link>

          <div style={sectionTitleStyle}>Basic</div>
          <Link
            to="/layout"
            style={location.pathname === '/layout' ? activeLinkStyle : linkStyle}
          >
            Layout
          </Link>
          <Link
            to="/composition"
            style={location.pathname === '/composition' ? activeLinkStyle : linkStyle}
          >
            Composition
          </Link>
          <Link
            to="/complement"
            style={location.pathname === '/complement' ? activeLinkStyle : linkStyle}
          >
            Complement
          </Link>
          <Link
            to="/division"
            style={location.pathname === '/division' ? activeLinkStyle : linkStyle}
          >
            Division (Tiling)
          </Link>
          <Link
            to="/product"
            style={location.pathname === '/product' ? activeLinkStyle : linkStyle}
          >
            Product (Tiling)
          </Link>

          <div style={sectionTitleStyle}>Advanced</div>
          <Link
            to="/bank-conflict"
            style={location.pathname === '/bank-conflict' ? activeLinkStyle : linkStyle}
          >
            Bank Conflict
          </Link>

        </nav>
      </aside>
      <button
        style={toggleButtonStyle}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? '→' : '←'}
      </button>
    </>
  )
}

export default Navbar
