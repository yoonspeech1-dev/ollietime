import { useState, useEffect } from 'react'
import './TimeInput.css'

// 다양한 시간 형식을 24시간 형식(HH:MM)으로 변환
const parseTimeInput = (input) => {
  if (!input || typeof input !== 'string') return ''

  const trimmed = input.trim()
  if (!trimmed) return ''

  // 이미 HH:MM 형식인 경우
  const time24Match = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (time24Match) {
    const h = parseInt(time24Match[1], 10)
    const m = parseInt(time24Match[2], 10)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
  }

  // 오전/오후 형식: "오전 9:30", "오후 2:30", "오전9:30", "오후2:30"
  const koreanMatch = trimmed.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/)
  if (koreanMatch) {
    const period = koreanMatch[1]
    let h = parseInt(koreanMatch[2], 10)
    const m = parseInt(koreanMatch[3], 10)

    if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
      if (period === '오후' && h !== 12) h += 12
      if (period === '오전' && h === 12) h = 0
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
  }

  // AM/PM 형식: "9:30 AM", "2:30 PM", "9:30AM", "2:30PM"
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i)
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10)
    const m = parseInt(ampmMatch[2], 10)
    const period = ampmMatch[3].toUpperCase()

    if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
      if (period === 'PM' && h !== 12) h += 12
      if (period === 'AM' && h === 12) h = 0
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
  }

  // 시간만 입력한 경우: "9", "14"
  const hourOnlyMatch = trimmed.match(/^(\d{1,2})$/)
  if (hourOnlyMatch) {
    const h = parseInt(hourOnlyMatch[1], 10)
    if (h >= 0 && h <= 23) {
      return `${String(h).padStart(2, '0')}:00`
    }
  }

  // 오전/오후 + 시간만: "오전 9", "오후 2"
  const koreanHourMatch = trimmed.match(/^(오전|오후)\s*(\d{1,2})$/)
  if (koreanHourMatch) {
    const period = koreanHourMatch[1]
    let h = parseInt(koreanHourMatch[2], 10)

    if (h >= 1 && h <= 12) {
      if (period === '오후' && h !== 12) h += 12
      if (period === '오전' && h === 12) h = 0
      return `${String(h).padStart(2, '0')}:00`
    }
  }

  return ''
}

// 24시간 형식을 12시간 오전/오후 형식으로 변환
const formatToKorean = (time24) => {
  if (!time24) return ''

  const match = time24.match(/^(\d{2}):(\d{2})/)
  if (!match) return time24

  let h = parseInt(match[1], 10)
  const m = match[2]

  const period = h >= 12 ? '오후' : '오전'
  if (h > 12) h -= 12
  if (h === 0) h = 12

  return `${period} ${h}:${m}`
}

function TimeInput({ value, onChange, className, placeholder, ...props }) {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // value가 변경되면 displayValue 업데이트
  useEffect(() => {
    if (!isFocused && value) {
      setDisplayValue(formatToKorean(value))
    } else if (!value) {
      setDisplayValue('')
    }
  }, [value, isFocused])

  const handleFocus = () => {
    setIsFocused(true)
    // 포커스 시 원본 값 또는 표시 값 유지
    if (value) {
      setDisplayValue(formatToKorean(value))
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    const parsed = parseTimeInput(displayValue)
    if (parsed) {
      onChange({ target: { value: parsed } })
      setDisplayValue(formatToKorean(parsed))
    } else if (displayValue.trim() === '') {
      onChange({ target: { value: '' } })
      setDisplayValue('')
    } else {
      // 파싱 실패 시 이전 값으로 복원
      setDisplayValue(value ? formatToKorean(value) : '')
    }
  }

  const handleChange = (e) => {
    setDisplayValue(e.target.value)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`time-input-custom ${className || ''}`}
      placeholder={placeholder || '오전 9:00'}
      {...props}
    />
  )
}

export default TimeInput
