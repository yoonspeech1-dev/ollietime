import { supabase } from './supabase'

// 회원가입
export const signUp = async (email, password, displayName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  })

  if (error) {
    throw error
  }

  return data
}

// 로그인
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw error
  }

  return data
}

// 로그아웃
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

// 현재 사용자 정보
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// 현재 세션
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// 사용자 역할 조회
export const getUserRole = async (userId) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user role:', error)
    return 'user'
  }

  return data?.role || 'user'
}

// 현재 사용자의 employee 정보 조회
export const getCurrentEmployee = async (userId) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching employee:', error)
    return null
  }

  return data
}

// 인증 상태 변경 리스너
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}
