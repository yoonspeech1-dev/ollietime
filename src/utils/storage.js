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
    endTime: record.end_time
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
    endTime: data.end_time
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

  const { error } = await supabase
    .from('work_records')
    .update({
      start_time: updatedData.startTime,
      end_time: updatedData.endTime,
      updated_at: new Date().toISOString()
    })
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

// 근무 시간 계산
export const calculateWorkHours = (startTime, endTime) => {
  if (!startTime || !endTime) return null

  const [startH, startM, startS] = startTime.split(':').map(Number)
  const [endH, endM, endS] = endTime.split(':').map(Number)

  const startMinutes = startH * 60 + startM + (startS || 0) / 60
  const endMinutes = endH * 60 + endM + (endS || 0) / 60

  const diff = endMinutes - startMinutes

  if (diff < 0) return null

  const hours = Math.floor(diff / 60)
  const minutes = Math.floor(diff % 60)

  return { hours, minutes, totalMinutes: diff }
}

// CSV 내보내기
export const exportToCSV = (records) => {
  const headers = ['날짜', '근무 시작', '근무 종료', '총 근무시간']
  const rows = records.map(record => {
    const workHours = calculateWorkHours(record.startTime, record.endTime)
    const duration = workHours
      ? `${workHours.hours}시간 ${workHours.minutes}분`
      : '-'
    return [
      record.date,
      record.startTime || '-',
      record.endTime || '-',
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
