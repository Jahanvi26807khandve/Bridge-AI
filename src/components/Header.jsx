import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/auth-context.js'

const links = [
  { label: 'Home', to: '/' },
  { label: 'About us', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const { user, loading, signOut } = useAuth()

  function closeMenu() {
    setIsMenuOpen(false)
  }

  async function handleSignOut() {
    setSignOutError('')
    try {
      await signOut()
    } catch {
      setSignOutError('We couldn’t sign you out. Please try again.')
    }
  }

  return (
    <header className="topbar">
      <NavLink className="wordmark" to="/" aria-label="BridgeAI home" onClick={closeMenu}>
        BridgeAI
      </NavLink>
      <div className="header-actions">
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
      </div>
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
        {loading ? (
          <span className="auth-status" role="status">
            Checking sign-in…
          </span>
        ) : user ? (
          <div className="account-controls">
            <NavLink
              className="account-link"
              to="/account"
              aria-label={`Account for ${user.displayName || user.email || 'signed-in user'}`}
              onClick={closeMenu}
            >
              {user.photoURL && (
                <img className="account-avatar" src={user.photoURL} alt="" />
              )}
              <span className="account-name">
                {user.displayName || user.email || 'Signed in'}
              </span>
            </NavLink>
            <button
              className="sign-out-button"
              type="button"
              onClick={handleSignOut}
            >
              Sign out
            </button>
            {signOutError && (
              <span className="auth-header-feedback" role="status">
                {signOutError}
              </span>
            )}
          </div>
        ) : (
          <NavLink
            className={({ isActive }) =>
              `nav-link sign-in-link${isActive ? ' active' : ''}`
            }
            to="/signin"
            onClick={closeMenu}
          >
            Sign in
          </NavLink>
        )}
      </nav>
    </header>
  )
}

export default Header
