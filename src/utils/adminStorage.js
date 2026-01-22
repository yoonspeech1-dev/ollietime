import { supabase } from '../lib/supabase'
import { calculateWorkHours, formatDate } from './storage'

// ============ 회원 관리 함수 ============

// 모든 회원 목록 조회 (user_roles + employees 별도 조회 후 병합)
export const getAllMembers = async () => {
  // 1. user_roles 조회
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('id, user_id, role, created_at')
    .order('created_at', { ascending: false })

  if (rolesError) {
    console.error('Error fetching user roles:', rolesError)
    return []
  }

  if (!roles || roles.length === 0) {
    return []
  }

  // 2. employees 조회
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, user_id, name, profile_image_url')

  if (empError) {
    console.error('Error fetching employees:', empError)
  }

  // 3. user_id로 매핑
  const employeeMap = {}
  if (employees) {
    employees.forEach(emp => {
      employeeMap[emp.user_id] = emp
    })
  }

  // 4. 병합하여 반환
  return roles.map(member => {
    const emp = employeeMap[member.user_id]
    return {
      id: member.id,
      userId: member.user_id,
      role: member.role,
      createdAt: member.created_at,
      employeeId: emp?.id,
      name: emp?.name || '이름 없음',
      profileImageUrl: emp?.profile_image_url || null
    }
  })
}

// 회원 역할 변경
export const updateMemberRole = async (userId, newRole) => {
  const { error } = await supabase
    .from('user_roles')
    .update({ role: newRole })
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating member role:', error)
    return false
  }

  return true
}

// 회원 이름 변경
export const updateMemberName = async (userId, newName) => {
  const { error } = await supabase
    .from('employees')
    .update({ name: newName })
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating member name:', error)
    return false
  }

  return true
}

// 회원 삭제 (work_records, employees, user_roles 순서로 삭제)
export const deleteMember = async (userId) => {
  // 1. 먼저 employee_id 조회
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .single()

  // 2. 해당 직원의 근무 기록 삭제
  if (employee) {
    const { error: recordsError } = await supabase
      .from('work_records')
      .delete()
      .eq('employee_id', employee.id)

    if (recordsError) {
      console.error('Error deleting work records:', recordsError)
      return false
    }
  }

  // 3. employees 삭제
  const { error: empError } = await supabase
    .from('employees')
    .delete()
    .eq('user_id', userId)

  if (empError) {
    console.error('Error deleting employee:', empError)
    return false
  }

  // 4. user_roles 삭제
  const { error: roleError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)

  if (roleError) {
    console.error('Error deleting user role:', roleError)
    return false
  }

  return true
}

// ============ 직원 관리 함수 ============

// 모든 직원 목록 조회
export const getAllEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching employees:', error)
    return []
  }

  return data
}

// 특정 직원 정보 조회
export const getEmployeeById = async (employeeId) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single()

  if (error) {
    console.error('Error fetching employee:', error)
    return null
  }

  return data
}

// 특정 직원의 모든 근무 기록 조회
export const getEmployeeRecords = async (employeeId) => {
  const { data, error } = await supabase
    .from('work_records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching employee records:', error)
    return []
  }

  return data.map(record => ({
    date: record.date,
    startTime: record.start_time,
    endTime: record.end_time,
    pauseIntervals: record.pause_intervals || []
  }))
}

// 직원 근무 기록 수정 (관리자용)
export const updateEmployeeRecord = async (employeeId, date, updatedData) => {
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
    console.error('Error updating employee record:', error)
    return null
  }

  return await getEmployeeRecords(employeeId)
}

// 직원 근무 기록 삭제 (관리자용)
export const deleteEmployeeRecord = async (employeeId, date) => {
  const { error } = await supabase
    .from('work_records')
    .delete()
    .eq('employee_id', employeeId)
    .eq('date', date)

  if (error) {
    console.error('Error deleting employee record:', error)
    return null
  }

  return await getEmployeeRecords(employeeId)
}

// 직원 근무 기록 추가 (관리자용)
export const addEmployeeRecord = async (employeeId, record) => {
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
    console.error('Error adding employee record:', error)
    return null
  }

  return await getEmployeeRecords(employeeId)
}

// 모든 직원의 근무 기록 요약 조회 (최적화: 2번의 쿼리로 처리)
export const getAllEmployeesWithStats = async () => {
  // 1. 모든 직원 조회
  const employees = await getAllEmployees()
  if (employees.length === 0) return []

  // 2. 모든 근무 기록을 한 번에 조회
  const { data: allRecords, error } = await supabase
    .from('work_records')
    .select('employee_id, date, start_time, end_time, pause_intervals')

  if (error) {
    console.error('Error fetching all records:', error)
    return employees.map(emp => ({
      ...emp,
      recordCount: 0,
      thisMonthRecords: 0,
      thisMonthMinutes: 0
    }))
  }

  // 이번 달 기준
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // 직원별로 그룹화하여 통계 계산
  const recordsByEmployee = {}
  allRecords.forEach(record => {
    const empId = record.employee_id
    if (!recordsByEmployee[empId]) {
      recordsByEmployee[empId] = []
    }
    recordsByEmployee[empId].push({
      date: record.date,
      startTime: record.start_time,
      endTime: record.end_time,
      pauseIntervals: record.pause_intervals || []
    })
  })

  // 각 직원의 통계 계산
  const employeesWithStats = employees.map(employee => {
    const records = recordsByEmployee[employee.id] || []

    const thisMonthRecords = records.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate.getMonth() === currentMonth &&
             recordDate.getFullYear() === currentYear
    })

    let totalMinutes = 0
    thisMonthRecords.forEach(record => {
      const workHours = calculateWorkHours(
        record.startTime,
        record.endTime,
        record.pauseIntervals
      )
      if (workHours) {
        totalMinutes += workHours.totalMinutes
      }
    })

    return {
      ...employee,
      recordCount: records.length,
      thisMonthRecords: thisMonthRecords.length,
      thisMonthMinutes: totalMinutes
    }
  })

  return employeesWithStats
}

// 직원별 근무 기록 CSV 내보내기 (관리자용)
export const exportEmployeeToCSV = async (employeeId, employeeName) => {
  const records = await getEmployeeRecords(employeeId)

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
  link.download = `${employeeName}_근무기록_${formatDate(new Date())}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// 전체 직원 근무 기록 CSV 내보내기 (관리자용)
export const exportAllEmployeesToCSV = async () => {
  const employees = await getAllEmployees()

  const headers = ['직원명', '날짜', '근무 시작', '근무 종료', '일시중지 시간', '실제 근무시간']
  const allRows = []

  for (const employee of employees) {
    const records = await getEmployeeRecords(employee.id)
    records.forEach(record => {
      const workHours = calculateWorkHours(record.startTime, record.endTime, record.pauseIntervals)
      const duration = workHours
        ? `${workHours.hours}시간 ${workHours.minutes}분`
        : '-'
      const pausedTime = workHours && workHours.pausedMinutes > 0
        ? `${Math.floor(workHours.pausedMinutes / 60)}시간 ${Math.floor(workHours.pausedMinutes % 60)}분`
        : '-'
      allRows.push([
        employee.name,
        record.date,
        record.startTime || '-',
        record.endTime || '-',
        pausedTime,
        duration
      ])
    })
  }

  const csvContent = [headers, ...allRows]
    .map(row => row.join(','))
    .join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `전체직원_근무기록_${formatDate(new Date())}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
