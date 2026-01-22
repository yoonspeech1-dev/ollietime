import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
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
  const profileImage = employee?.profile_image_url

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
              <span className={`user-avatar ${profileImage ? 'has-image' : ''}`}>
                {profileImage ? (
                  <img src={profileImage} alt={displayName} className="avatar-img" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
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
                  <span className={`dropdown-avatar ${profileImage ? 'has-image' : ''}`}>
                    {profileImage ? (
                      <img src={profileImage} alt={displayName} className="dropdown-avatar-img" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="dropdown-info">
                    <span className="dropdown-name">{displayName}</span>
                    <span className="dropdown-email">{user?.email}</span>
                    {isAdmin && <span className="dropdown-role">관리자</span>}
                  </div>
                </div>
                <div className="user-dropdown-divider"></div>
                <Link to="/profile" className="user-dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  프로필 설정
                </Link>
                <button className="user-dropdown-item logout" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
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
