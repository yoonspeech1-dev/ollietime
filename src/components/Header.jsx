import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../lib/auth'
import './Header.css'

function Header() {
  const { user, employee, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const displayName = employee?.name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || '사용자'

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <img src="/ollie-avatar.png" alt="올리" className="logo-icon" />
          <div className="logo-text">
            <span className="logo-title">올리타임</span>
            <span className="logo-subtitle">윤스피치</span>
          </div>
        </div>
        <nav className="nav">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            근무 기록
          </NavLink>
          <NavLink
            to="/records"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            근무시간 확인
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link admin-link ${isActive ? 'active' : ''}`}
            >
              관리자
            </NavLink>
          )}
          <div className="user-menu-container" ref={menuRef}>
            <button
              className="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="user-avatar">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="user-name">{displayName}</span>
              <svg
                className={`dropdown-icon ${showUserMenu ? 'open' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <span className="dropdown-name">{displayName}</span>
                  <span className="dropdown-email">{user?.email}</span>
                  {isAdmin && <span className="dropdown-role">관리자</span>}
                </div>
                <div className="user-dropdown-divider"></div>
                <button className="user-dropdown-item logout" onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
