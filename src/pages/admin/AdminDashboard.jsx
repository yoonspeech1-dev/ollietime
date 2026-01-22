import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllEmployeesWithStats, exportAllEmployeesToCSV } from '../../utils/adminStorage'
import './AdminDashboard.css'

function AdminDashboard() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    setLoading(true)
    const data = await getAllEmployeesWithStats()
    setEmployees(data)
    setLoading(false)
  }

  const handleExportAll = async () => {
    setExporting(true)
    await exportAllEmployeesToCSV()
    setExporting(false)
  }

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return `${hours}시간 ${mins}분`
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>직원 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-title-section">
          <h1 className="admin-title">직원 관리</h1>
          <p className="admin-subtitle">
            전체 직원 {employees.length}명
          </p>
        </div>
        <div className="admin-actions">
          <Link to="/admin/members" className="member-manage-button">
            회원 관리
          </Link>
          <button
            className="export-all-button"
            onClick={handleExportAll}
            disabled={exporting || employees.length === 0}
          >
            {exporting ? '내보내는 중...' : '전체 기록 내보내기'}
          </button>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="empty-state">
          <p>등록된 직원이 없습니다.</p>
        </div>
      ) : (
        <div className="employees-grid">
          {employees.map((employee) => (
            <Link
              key={employee.id}
              to={`/admin/employees/${employee.id}`}
              className="employee-card"
            >
              <div className="employee-avatar">
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div className="employee-info">
                <h3 className="employee-name">{employee.name}</h3>
                <div className="employee-stats">
                  <div className="stat">
                    <span className="stat-label">전체 기록</span>
                    <span className="stat-value">{employee.recordCount}건</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">이번 달</span>
                    <span className="stat-value">{employee.thisMonthRecords}건</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">이번 달 근무</span>
                    <span className="stat-value">{formatMinutes(employee.thisMonthMinutes)}</span>
                  </div>
                </div>
              </div>
              <div className="employee-arrow">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M7.5 5L12.5 10L7.5 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
