import Calendar from '../components/Calendar'
import './CalendarPage.css'

function CalendarPage() {
  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1 className="page-title">근무 기록</h1>
        <p className="page-description">날짜를 선택하고 근무 시작/종료 시간을 기록하세요</p>
      </div>
      <Calendar />
    </div>
  )
}

export default CalendarPage
