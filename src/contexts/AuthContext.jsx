import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChange, getUserRole, getCurrentEmployee } from '../lib/auth'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [employee, setEmployee] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // 타임아웃이 있는 Promise wrapper
    const withTimeout = (promise, timeoutMs = 5000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ])
    }

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (session?.user) {
        setUser(session.user)

        try {
          // 사용자 역할 조회 (5초 타임아웃)
          const userRole = await withTimeout(getUserRole(session.user.id))
          if (isMounted) setRole(userRole)

          // employee 정보 조회 (5초 타임아웃)
          const employeeData = await withTimeout(getCurrentEmployee(session.user.id))
          if (isMounted) setEmployee(employeeData)
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Auth state change error:', error)
          }
          // 타임아웃이나 에러 시 기본값 설정
          if (isMounted) {
            setRole('user')
            setEmployee(null)
          }
        }
      } else {
        setUser(null)
        setRole(null)
        setEmployee(null)
      }
      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const isAdmin = role === 'admin'
  const isAuthenticated = !!user

  const value = {
    user,
    employee,
    role,
    isAdmin,
    isAuthenticated,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
