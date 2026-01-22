import { useState, useEffect } from 'react'
import { getAllMembers, updateMemberRole, updateMemberName, deleteMember } from '../../utils/adminStorage'
import './MemberManagement.css'

function MemberManagement() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    setLoading(true)
    const data = await getAllMembers()
    setMembers(data)
    setLoading(false)
  }

  const handleRoleChange = async (userId, newRole) => {
    if (window.confirm(`역할을 ${newRole === 'admin' ? '관리자' : '일반 회원'}으로 변경하시겠습니까?`)) {
      const success = await updateMemberRole(userId, newRole)
      if (success) {
        await loadMembers()
      } else {
        alert('역할 변경에 실패했습니다.')
      }
    }
  }

  const handleEditName = (member) => {
    setEditingId(member.userId)
    setEditName(member.name)
  }

  const handleSaveName = async (userId) => {
    if (!editName.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    const success = await updateMemberName(userId, editName.trim())
    if (success) {
      setEditingId(null)
      setEditName('')
      await loadMembers()
    } else {
      alert('이름 변경에 실패했습니다.')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleDelete = async (userId, name) => {
    if (window.confirm(`"${name}" 회원을 정말 삭제하시겠습니까?\n\n주의: 이 작업은 되돌릴 수 없으며, 해당 회원의 모든 근무 기록도 삭제됩니다.`)) {
      const success = await deleteMember(userId)
      if (success) {
        await loadMembers()
      } else {
        alert('회원 삭제에 실패했습니다.')
      }
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="member-management">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>회원 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="member-management">
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">회원 관리</h1>
          <p className="page-description">전체 회원 {members.length}명</p>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="empty-state">
          <p>등록된 회원이 없습니다.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="members-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>역할</th>
                <th>가입일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="name-cell">
                    {editingId === member.userId ? (
                      <div className="edit-name-form">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="name-input"
                          autoFocus
                        />
                        <button className="save-btn" onClick={() => handleSaveName(member.userId)}>
                          저장
                        </button>
                        <button className="cancel-btn" onClick={handleCancelEdit}>
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="name-display">
                        <span className="member-avatar">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="member-name">{member.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="role-cell">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                      className={`role-select ${member.role}`}
                    >
                      <option value="user">일반 회원</option>
                      <option value="admin">관리자</option>
                    </select>
                  </td>
                  <td className="date-cell">
                    {formatDate(member.createdAt)}
                  </td>
                  <td className="action-cell">
                    <div className="row-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditName(member)}
                        title="이름 수정"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(member.userId, member.name)}
                        title="회원 삭제"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default MemberManagement
