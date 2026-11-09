import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  function closeMenu() {
    setIsMenuOpen(false)
  }

  return (
    <header className="topbar">
      <NavLink className="wordmark" to="/" aria-label="BridgeAI home" onClick={closeMenu}>
        BridgeAI
      </NavLink>
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={isMenuOpen}
        aria-controls="primary-navigation"
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav
        id="primary-navigation"
        className={`primary-navigation${isMenuOpen ? ' is-open' : ''}`}
        aria-label="Primary navigation"
      >
        {links.map(({ label, to }) => (
          <NavLink
            key={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            to={to}
            end={to === '/'}
            onClick={closeMenu}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

export default Header
