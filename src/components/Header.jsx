import { NavLink } from 'react-router-dom'
import './Header.css'

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <span className="logo-icon">O</span>
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
        </nav>
      </div>
    </header>
  )
}

export default Header
