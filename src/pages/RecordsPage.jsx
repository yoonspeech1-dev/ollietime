import { useState, useEffect } from 'react'
import { getRecords, deleteRecord, updateRecord, calculateWorkHours, exportToCSV } from '../utils/storage'
import './RecordsPage.css'

function RecordsPage() {
  const [records, setRecords] = useState([])
  const [editingDate, setEditingDate] = useState(null)
  const [editForm, setEditForm] = useState({ startTime: '', endTime: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    setLoading(true)
    const data = await getRecords()
    setRecords(data)
    setLoading(false)
  }

  const handleDelete = async (date) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      const updated = await deleteRecord(date)
      if (updated) {
        setRecords(updated)
      }
    }
  }

  const handleEdit = (record) => {
    setEditingDate(record.date)
    setEditForm({
      startTime: record.startTime || '',
      endTime: record.endTime || ''
    })
  }

  const handleSaveEdit = async () => {
    const updated = await updateRecord(editingDate, editForm)
    if (updated) {
      setRecords(updated)
    }
    setEditingDate(null)
  }

  const handleCancelEdit = () => {
    setEditingDate(null)
    setEditForm({ startTime: '', endTime: '' })
  }

  const handleExportCSV = () => {
    exportToCSV(records)
  }

  const getTotalWorkTime = () => {
    let totalMinutes = 0
    records.forEach(record => {
      const workHours = calculateWorkHours(record.startTime, record.endTime, record.pauseIntervals)
      if (workHours) {
        totalMinutes += workHours.totalMinutes
      }
    })
    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.floor(totalMinutes % 60)
    return { hours, minutes }
  }

  const formatWorkDuration = (startTime, endTime, pauseIntervals) => {
    const workHours = calculateWorkHours(startTime, endTime, pauseIntervals)
    if (!workHours) return '-'
    return `${workHours.hours}시간 ${workHours.minutes}분`
  }

  const formatPausedTime = (pauseIntervals, endTime) => {
    if (!pauseIntervals || pauseIntervals.length === 0) return null
    const workHours = calculateWorkHours('00:00:00', '23:59:59', [])
    let totalPausedMinutes = 0
    for (const interval of pauseIntervals) {
      const [ph, pm, ps] = interval.pauseTime.split(':').map(Number)
      const pauseMinutes = ph * 60 + pm + (ps || 0) / 60
      let resumeMinutes
      if (interval.resumeTime) {
        const [rh, rm, rs] = interval.resumeTime.split(':').map(Number)
        resumeMinutes = rh * 60 + rm + (rs || 0) / 60
      } else if (endTime) {
        const [eh, em, es] = endTime.split(':').map(Number)
        resumeMinutes = eh * 60 + em + (es || 0) / 60
      }
      if (resumeMinutes !== undefined) {
        totalPausedMinutes += resumeMinutes - pauseMinutes
      }
    }
    if (totalPausedMinutes <= 0) return null
    const hours = Math.floor(totalPausedMinutes / 60)
    const minutes = Math.floor(totalPausedMinutes % 60)
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    }
    return `${minutes}분`
  }

  const totalWork = getTotalWorkTime()

  if (loading) {
    return (
      <div className="records-page">
        <div className="loading-state">
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="records-page">
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">근무시간 확인</h1>
          <p className="page-description">기록된 모든 근무 일정을 확인하세요</p>
        </div>
        <button className="export-btn" onClick={handleExportCSV} disabled={records.length === 0}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          CSV 내보내기
        </button>
      </div>

      <div className="summary-card">
        <div className="summary-item">
          <span className="summary-label">총 근무일</span>
          <span className="summary-value">{records.length}일</span>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-item">
          <span className="summary-label">총 근무시간</span>
          <span className="summary-value">{totalWork.hours}시간 {totalWork.minutes}분</span>
        </div>
      </div>

      {records.length > 0 ? (
        <div className="table-container">
          <table className="records-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>근무 시작</th>
                <th>근무 종료</th>
                <th>일시중지</th>
                <th>실근무시간</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.date}>
                  <td className="date-cell">{record.date}</td>
                  <td className="time-cell">
                    {editingDate === record.date ? (
                      <input
                        type="time"
                        step="1"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                        className="time-input"
                      />
                    ) : (
                      record.startTime || '-'
                    )}
                  </td>
                  <td className="time-cell">
                    {editingDate === record.date ? (
                      <input
                        type="time"
                        step="1"
                        value={editForm.endTime}
                        onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                        className="time-input"
                      />
                    ) : (
                      record.endTime || '-'
                    )}
                  </td>
                  <td className="pause-cell">
                    {formatPausedTime(record.pauseIntervals, record.endTime) || '-'}
                  </td>
                  <td className="duration-cell">
                    {formatWorkDuration(record.startTime, record.endTime, record.pauseIntervals)}
                  </td>
                  <td className="action-cell">
                    {editingDate === record.date ? (
                      <div className="edit-actions">
                        <button className="save-btn" onClick={handleSaveEdit}>저장</button>
                        <button className="cancel-btn" onClick={handleCancelEdit}>취소</button>
                      </div>
                    ) : (
                      <div className="row-actions">
                        <button className="edit-btn" onClick={() => handleEdit(record)}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button className="delete-btn" onClick={() => handleDelete(record.date)}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <p>아직 근무 기록이 없습니다</p>
          <span>메인 페이지에서 근무 시간을 기록해 주세요</span>
        </div>
      )}
    </div>
  )
}

export default RecordsPage
