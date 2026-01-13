import { useState, useEffect, useCallback } from 'react'
import { getRecords, getRecordByDate, saveRecord, getCurrentTimeKST, formatDate } from '../utils/storage'
import './Calendar.css'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [records, setRecords] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [loading, setLoading] = useState(true)

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
      endTime: selectedRecord?.endTime || null
    })
    if (updatedRecords) {
      setRecords(updatedRecords)
    }
  }

  const handleEndWork = async () => {
    if (!selectedDate) return
    const time = getCurrentTimeKST()
    const updatedRecords = await saveRecord({
      date: selectedDate,
      startTime: selectedRecord?.startTime || null,
      endTime: time
    })
    if (updatedRecords) {
      setRecords(updatedRecords)
    }
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
            <div className="record-info">
              {selectedRecord ? (
                <>
                  <div className="record-item">
                    <span className="record-label">근무 시작</span>
                    <span className="record-value">{selectedRecord.startTime || '-'}</span>
                  </div>
                  <div className="record-item">
                    <span className="record-label">근무 종료</span>
                    <span className="record-value">{selectedRecord.endTime || '-'}</span>
                  </div>
                </>
              ) : (
                <p className="no-record">근무 기록이 없습니다</p>
              )}
            </div>
            <div className="action-buttons">
              <button
                className="action-btn start-btn"
                onClick={handleStartWork}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                근무 시작
              </button>
              <button
                className="action-btn end-btn"
                onClick={handleEndWork}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                근무 종료
              </button>
            </div>
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
