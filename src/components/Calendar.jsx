import { useState, useEffect, useCallback } from 'react'
import { getRecords, getRecordByDate, saveRecord, getCurrentTimeKST, formatDate, calculateWorkHours, formatTime } from '../utils/storage'
import TimeInput from './TimeInput'
import './Calendar.css'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [records, setRecords] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [manualMode, setManualMode] = useState(false)
  const [manualForm, setManualForm] = useState({ startTime: '', endTime: '' })
  // 일시정지 수정 상태
  const [editingPauseIndex, setEditingPauseIndex] = useState(null)
  const [pauseEditForm, setPauseEditForm] = useState({ pauseTime: '', resumeTime: '' })
  const [addingNewPause, setAddingNewPause] = useState(false)

  const loadRecords = useCallback(async () => {
    setLoading(true)
    const data = await getRecords()
    setRecords(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  useEffect(() => {
    const loadSelectedRecord = async () => {
      if (selectedDate) {
        const record = await getRecordByDate(selectedDate)
        setSelectedRecord(record || null)
        setManualMode(false)
        setManualForm({ startTime: '', endTime: '' })
      }
    }
    loadSelectedRecord()
  }, [selectedDate, records])

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days = []

    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -startingDay + i + 1)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(formatDate(today))
  }

  const handleDateClick = (date) => {
    setSelectedDate(formatDate(date))
  }

  const handleStartWork = async () => {
    if (!selectedDate) return
    const time = getCurrentTimeKST()
    const updatedRecords = await saveRecord({
      date: selectedDate,
      startTime: time,
      endTime: null,
      pauseIntervals: []
    })
    if (updatedRecords) {
      setRecords(updatedRecords)
    }
  }

  const handleEndWork = async () => {
    if (!selectedDate || !selectedRecord?.startTime) return
    const time = getCurrentTimeKST()

    // 현재 일시중지 중이면 종료 시 자동으로 재개 처리
    let pauseIntervals = selectedRecord?.pauseIntervals || []
    if (isPaused) {
      pauseIntervals = pauseIntervals.map((interval, idx) =>
        idx === pauseIntervals.length - 1 && !interval.resumeTime
          ? { ...interval, resumeTime: time }
          : interval
      )
    }

    const updatedRecords = await saveRecord({
      date: selectedDate,
      startTime: selectedRecord.startTime,
      endTime: time,
      pauseIntervals
    })
    if (updatedRecords) {
      setRecords(updatedRecords)
    }
  }

  const handlePauseWork = async () => {
    if (!selectedDate || !selectedRecord?.startTime || selectedRecord?.endTime) return
    const time = getCurrentTimeKST()
    const pauseIntervals = [...(selectedRecord?.pauseIntervals || []), { pauseTime: time, resumeTime: null }]

    const updatedRecords = await saveRecord({
      date: selectedDate,
      startTime: selectedRecord.startTime,
      endTime: null,
      pauseIntervals
    })
    if (updatedRecords) {
      setRecords(updatedRecords)
    }
  }

  const handleResumeWork = async () => {
    if (!selectedDate || !selectedRecord?.startTime) return
    const time = getCurrentTimeKST()

    const pauseIntervals = (selectedRecord?.pauseIntervals || []).map((interval, idx) =>
      idx === selectedRecord.pauseIntervals.length - 1 && !interval.resumeTime
        ? { ...interval, resumeTime: time }
        : interval
    )

    const updatedRecords = await saveRecord({
      date: selectedDate,
      startTime: selectedRecord.startTime,
      endTime: null,
      pauseIntervals
    })
    if (updatedRecords) {
      setRecords(updatedRecords)
    }
  }

  // 현재 일시중지 상태인지 확인
  const isPaused = selectedRecord?.pauseIntervals?.length > 0 &&
    !selectedRecord.pauseIntervals[selectedRecord.pauseIntervals.length - 1].resumeTime

  // 근무 상태 확인
  const isWorking = selectedRecord?.startTime && !selectedRecord?.endTime
  const isWorkEnded = selectedRecord?.startTime && selectedRecord?.endTime

  // 선택한 날짜가 오늘인지 확인
  const isSelectedDateToday = selectedDate === formatDate(new Date())

  // 수동 입력 모드 시작
  const handleManualMode = () => {
    setManualMode(true)
    if (selectedRecord) {
      setManualForm({
        startTime: selectedRecord.startTime || '',
        endTime: selectedRecord.endTime || ''
      })
    } else {
      setManualForm({ startTime: '', endTime: '' })
    }
  }

  // 수동 입력 저장
  const handleSaveManual = async () => {
    if (!selectedDate || !manualForm.startTime) return

    const updatedRecords = await saveRecord({
      date: selectedDate,
      startTime: manualForm.startTime,
      endTime: manualForm.endTime || null,
      pauseIntervals: selectedRecord?.pauseIntervals || []
    })
    if (updatedRecords) {
      setRecords(updatedRecords)
    }
    setManualMode(false)
  }

  // 수동 입력 취소
  const handleCancelManual = () => {
    setManualMode(false)
    setManualForm({ startTime: '', endTime: '' })
  }

  // 일시정지 수정 시작
  const handleEditPause = (index) => {
    const interval = selectedRecord.pauseIntervals[index]
    setEditingPauseIndex(index)
    setPauseEditForm({
      pauseTime: interval.pauseTime || '',
      resumeTime: interval.resumeTime || ''
    })
    setAddingNewPause(false)
  }

  // 일시정지 수정 저장
  const handleSavePauseEdit = async () => {
    if (!selectedDate || !selectedRecord) return

    let newPauseIntervals
    if (addingNewPause) {
      // 새 일시정지 추가
      newPauseIntervals = [
        ...(selectedRecord.pauseIntervals || []),
        {
          pauseTime: pauseEditForm.pauseTime,
          resumeTime: pauseEditForm.resumeTime || null
        }
      ]
    } else {
      // 기존 일시정지 수정
      newPauseIntervals = selectedRecord.pauseIntervals.map((interval, idx) =>
        idx === editingPauseIndex
          ? {
              pauseTime: pauseEditForm.pauseTime,
              resumeTime: pauseEditForm.resumeTime || null
            }
          : interval
      )
    }

    const updatedRecords = await saveRecord({
      date: selectedDate,
      startTime: selectedRecord.startTime,
      endTime: selectedRecord.endTime,
      pauseIntervals: newPauseIntervals
    })
    if (updatedRecords) {
      setRecords(updatedRecords)
    }
    setEditingPauseIndex(null)
    setAddingNewPause(false)
    setPauseEditForm({ pauseTime: '', resumeTime: '' })
  }

  // 일시정지 수정 취소
  const handleCancelPauseEdit = () => {
    setEditingPauseIndex(null)
    setAddingNewPause(false)
    setPauseEditForm({ pauseTime: '', resumeTime: '' })
  }

  // 일시정지 삭제
  const handleDeletePause = async (index) => {
    if (!selectedDate || !selectedRecord) return

    const newPauseIntervals = selectedRecord.pauseIntervals.filter((_, idx) => idx !== index)

    const updatedRecords = await saveRecord({
      date: selectedDate,
      startTime: selectedRecord.startTime,
      endTime: selectedRecord.endTime,
      pauseIntervals: newPauseIntervals
    })
    if (updatedRecords) {
      setRecords(updatedRecords)
    }
  }

  // 새 일시정지 추가 시작
  const handleAddNewPause = () => {
    setAddingNewPause(true)
    setEditingPauseIndex(null)
    setPauseEditForm({ pauseTime: '', resumeTime: '' })
  }

  const hasRecord = (dateStr) => {
    return records.some(r => r.date === dateStr)
  }

  const isToday = (date) => {
    const today = new Date()
    return formatDate(date) === formatDate(today)
  }

  const days = getDaysInMonth(currentDate)

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="calendar loading-state">
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-container">
      <div className="calendar">
        <div className="calendar-header">
          <div className="calendar-nav">
            <button className="nav-btn" onClick={goToPreviousMonth}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h2 className="calendar-title">
              {currentDate.getFullYear()}년 {MONTHS[currentDate.getMonth()]}
            </h2>
            <button className="nav-btn" onClick={goToNextMonth}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
          <button className="today-btn" onClick={goToToday}>
            오늘
          </button>
        </div>

        <div className="calendar-weekdays">
          {DAYS.map((day, index) => (
            <div
              key={day}
              className={`weekday ${index === 0 ? 'sunday' : ''} ${index === 6 ? 'saturday' : ''}`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {days.map((day, index) => {
            const dateStr = formatDate(day.date)
            const isSelected = selectedDate === dateStr
            const hasWorkRecord = hasRecord(dateStr)
            const isTodayDate = isToday(day.date)
            const dayOfWeek = day.date.getDay()

            return (
              <button
                key={index}
                className={`day-cell ${!day.isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${hasWorkRecord ? 'has-record' : ''} ${isTodayDate ? 'today' : ''} ${dayOfWeek === 0 ? 'sunday' : ''} ${dayOfWeek === 6 ? 'saturday' : ''}`}
                onClick={() => handleDateClick(day.date)}
              >
                <span className="day-number">{day.date.getDate()}</span>
                {hasWorkRecord && <span className="record-dot"></span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="work-panel">
        {selectedDate ? (
          <>
            <h3 className="panel-title">{selectedDate}</h3>

            {manualMode ? (
              /* 수동 입력 모드 */
              <div className="manual-input-mode">
                <div className="manual-form">
                  <div className="form-group">
                    <label className="form-label">근무 시작</label>
                    <TimeInput
                      value={manualForm.startTime}
                      onChange={(e) => setManualForm({ ...manualForm, startTime: e.target.value })}
                      className="time-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">근무 종료</label>
                    <TimeInput
                      value={manualForm.endTime}
                      onChange={(e) => setManualForm({ ...manualForm, endTime: e.target.value })}
                      className="time-input"
                    />
                  </div>
                </div>
                <div className="manual-actions">
                  <button className="action-btn save-btn" onClick={handleSaveManual} disabled={!manualForm.startTime}>
                    저장
                  </button>
                  <button className="action-btn cancel-btn" onClick={handleCancelManual}>
                    취소
                  </button>
                </div>
              </div>
            ) : (
              /* 일반 모드 */
              <>
                <div className="record-info">
                  {selectedRecord ? (
                    <>
                      <div className="record-item">
                        <span className="record-label">근무 시작</span>
                        <span className="record-value">{formatTime(selectedRecord.startTime) || '-'}</span>
                      </div>
                      <div className="record-item">
                        <span className="record-label">근무 종료</span>
                        <span className="record-value">{formatTime(selectedRecord.endTime) || '-'}</span>
                      </div>
                      {/* 일시정지 기록 */}
                      <div className="pause-info">
                        <div className="pause-header">
                          <span className="record-label">일시중지 기록</span>
                          {selectedRecord.startTime && (
                            <button className="pause-add-btn" onClick={handleAddNewPause} title="일시중지 추가">
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {selectedRecord.pauseIntervals && selectedRecord.pauseIntervals.length > 0 ? (
                          <div className="pause-list">
                            {selectedRecord.pauseIntervals.map((interval, idx) => (
                              <div key={idx} className="pause-item">
                                <span className="pause-time">
                                  {formatTime(interval.pauseTime)} ~ {interval.resumeTime ? formatTime(interval.resumeTime) : '(진행중)'}
                                </span>
                                <div className="pause-actions">
                                  <button
                                    className="pause-edit-btn"
                                    onClick={() => handleEditPause(idx)}
                                    title="수정"
                                  >
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                  </button>
                                  <button
                                    className="pause-delete-btn"
                                    onClick={() => handleDeletePause(idx)}
                                    title="삭제"
                                  >
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-pause">일시중지 기록이 없습니다</p>
                        )}
                      </div>

                      {/* 일시정지 수정/추가 모달 */}
                      {(editingPauseIndex !== null || addingNewPause) && (
                        <div className="pause-edit-modal">
                          <div className="pause-edit-title">
                            {addingNewPause ? '일시중지 추가' : '일시중지 수정'}
                          </div>
                          <div className="pause-edit-form">
                            <div className="form-group">
                              <label className="form-label">시작 시간</label>
                              <TimeInput
                                value={pauseEditForm.pauseTime}
                                onChange={(e) => setPauseEditForm({ ...pauseEditForm, pauseTime: e.target.value })}
                                className="time-input"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">종료 시간</label>
                              <TimeInput
                                value={pauseEditForm.resumeTime}
                                onChange={(e) => setPauseEditForm({ ...pauseEditForm, resumeTime: e.target.value })}
                                className="time-input"
                                placeholder="진행중이면 비워두세요"
                              />
                            </div>
                          </div>
                          <div className="pause-edit-actions">
                            <button
                              className="action-btn save-btn"
                              onClick={handleSavePauseEdit}
                              disabled={!pauseEditForm.pauseTime}
                            >
                              저장
                            </button>
                            <button className="action-btn cancel-btn" onClick={handleCancelPauseEdit}>
                              취소
                            </button>
                          </div>
                        </div>
                      )}
                      {selectedRecord.endTime && (
                        <div className="record-item work-duration">
                          <span className="record-label">실제 근무시간</span>
                          <span className="record-value">
                            {(() => {
                              const workHours = calculateWorkHours(
                                selectedRecord.startTime,
                                selectedRecord.endTime,
                                selectedRecord.pauseIntervals
                              )
                              return workHours
                                ? `${workHours.hours}시간 ${workHours.minutes}분`
                                : '-'
                            })()}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="no-record">근무 기록이 없습니다</p>
                  )}
                </div>
                {isPaused && (
                  <div className="pause-status">
                    <span className="pause-badge">일시중지 중</span>
                  </div>
                )}

                {/* 오늘 날짜: 실시간 버튼 */}
                {isSelectedDateToday && (
                  <div className="action-buttons three-buttons">
                    <button
                      className="action-btn start-btn"
                      onClick={handleStartWork}
                      disabled={isWorking || isWorkEnded}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      근무 시작
                    </button>
                    <button
                      className={`action-btn pause-btn ${isPaused ? 'resume' : ''}`}
                      onClick={isPaused ? handleResumeWork : handlePauseWork}
                      disabled={!isWorking}
                    >
                      {isPaused ? (
                        <>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          근무 재개
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                          일시중지
                        </>
                      )}
                    </button>
                    <button
                      className="action-btn end-btn"
                      onClick={handleEndWork}
                      disabled={!isWorking}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      근무 종료
                    </button>
                  </div>
                )}

                {/* 수동 입력 버튼 (항상 표시) */}
                <div className="manual-entry-section">
                  <button className="action-btn manual-btn" onClick={handleManualMode}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    {selectedRecord ? '시간 수정' : '시간 직접 입력'}
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="no-selection">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p>날짜를 선택하세요</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Calendar
