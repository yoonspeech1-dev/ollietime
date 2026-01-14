import { supabase } from '../lib/supabase'

// 올리의 employee_id 가져오기
const getEmployeeId = async () => {
  const { data } = await supabase
    .from('employees')
    .select('id')
    .eq('name', '올리')
    .single()
  return data?.id
}

// 모든 근무 기록 조회
export const getRecords = async () => {
  const employeeId = await getEmployeeId()
  if (!employeeId) return []

  const { data, error } = await supabase
    .from('work_records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching records:', error)
    return []
  }

  return data.map(record => ({
    date: record.date,
    startTime: record.start_time,
    endTime: record.end_time,
    pauseIntervals: record.pause_intervals || []
  }))
}

// 특정 날짜의 근무 기록 조회
export const getRecordByDate = async (date) => {
  const employeeId = await getEmployeeId()
  if (!employeeId) return null

  const { data, error } = await supabase
    .from('work_records')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .single()

  if (error || !data) return null

  return {
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
    pauseIntervals: data.pause_intervals || []
  }
}

// 근무 기록 저장 (upsert)
export const saveRecord = async (record) => {
  const employeeId = await getEmployeeId()
  if (!employeeId) return null

  const { error } = await supabase
    .from('work_records')
    .upsert({
      employee_id: employeeId,
      date: record.date,
      start_time: record.startTime,
      end_time: record.endTime,
      pause_intervals: record.pauseIntervals || [],
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'employee_id,date'
    })

  if (error) {
    console.error('Error saving record:', error)
    return null
  }

  return await getRecords()
}

// 근무 기록 삭제
export const deleteRecord = async (date) => {
  const employeeId = await getEmployeeId()
  if (!employeeId) return null

  const { error } = await supabase
    .from('work_records')
    .delete()
    .eq('employee_id', employeeId)
    .eq('date', date)

  if (error) {
    console.error('Error deleting record:', error)
    return null
  }

  return await getRecords()
}

// 근무 기록 수정
export const updateRecord = async (date, updatedData) => {
  const employeeId = await getEmployeeId()
  if (!employeeId) return null

  const updatePayload = {
    start_time: updatedData.startTime,
    end_time: updatedData.endTime,
    updated_at: new Date().toISOString()
  }

  if (updatedData.pauseIntervals !== undefined) {
    updatePayload.pause_intervals = updatedData.pauseIntervals
  }

  const { error } = await supabase
    .from('work_records')
    .update(updatePayload)
    .eq('employee_id', employeeId)
    .eq('date', date)

  if (error) {
    console.error('Error updating record:', error)
    return null
  }

  return await getRecords()
}

// 날짜 포맷
export const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 현재 시간 (KST)
export const getCurrentTimeKST = () => {
  const now = new Date()
  const kstOffset = 9 * 60
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const kstTime = new Date(utc + (kstOffset * 60000))

  const hours = String(kstTime.getHours()).padStart(2, '0')
  const minutes = String(kstTime.getMinutes()).padStart(2, '0')
  const seconds = String(kstTime.getSeconds()).padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}

// 시간 문자열을 분으로 변환하는 헬퍼 함수
const timeToMinutes = (timeStr) => {
  if (!timeStr) return null
  const [h, m, s] = timeStr.split(':').map(Number)
  return h * 60 + m + (s || 0) / 60
}

// 일시중지 총 시간 계산 (분 단위)
export const calculatePausedMinutes = (pauseIntervals, endTime) => {
  if (!pauseIntervals || pauseIntervals.length === 0) return 0

  let totalPausedMinutes = 0
  for (const interval of pauseIntervals) {
    const pauseMinutes = timeToMinutes(interval.pauseTime)
    // 재개되지 않은 경우 근무 종료 시간까지 계산
    const resumeMinutes = interval.resumeTime
      ? timeToMinutes(interval.resumeTime)
      : (endTime ? timeToMinutes(endTime) : null)

    if (pauseMinutes !== null && resumeMinutes !== null) {
      totalPausedMinutes += resumeMinutes - pauseMinutes
    }
  }
  return totalPausedMinutes
}

// 근무 시간 계산 (일시중지 시간 제외)
export const calculateWorkHours = (startTime, endTime, pauseIntervals = []) => {
  if (!startTime || !endTime) return null

  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  if (startMinutes === null || endMinutes === null) return null

  const totalDiff = endMinutes - startMinutes
  if (totalDiff < 0) return null

  // 일시중지 시간 제외
  const pausedMinutes = calculatePausedMinutes(pauseIntervals, endTime)
  const diff = totalDiff - pausedMinutes

  if (diff < 0) return null

  const hours = Math.floor(diff / 60)
  const minutes = Math.floor(diff % 60)

  return { hours, minutes, totalMinutes: diff, pausedMinutes }
}

// CSV 내보내기
export const exportToCSV = (records) => {
  const headers = ['날짜', '근무 시작', '근무 종료', '일시중지 시간', '실제 근무시간']
  const rows = records.map(record => {
    const workHours = calculateWorkHours(record.startTime, record.endTime, record.pauseIntervals)
    const duration = workHours
      ? `${workHours.hours}시간 ${workHours.minutes}분`
      : '-'
    const pausedTime = workHours && workHours.pausedMinutes > 0
      ? `${Math.floor(workHours.pausedMinutes / 60)}시간 ${Math.floor(workHours.pausedMinutes % 60)}분`
      : '-'
    return [
      record.date,
      record.startTime || '-',
      record.endTime || '-',
      pausedTime,
      duration
    ]
  })

  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `올리_근무기록_${formatDate(new Date())}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
