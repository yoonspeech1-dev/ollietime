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
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)

        // 사용자 역할 조회
        const userRole = await getUserRole(session.user.id)
        setRole(userRole)

        // employee 정보 조회
        const employeeData = await getCurrentEmployee(session.user.id)
        setEmployee(employeeData)
      } else {
        setUser(null)
        setRole(null)
        setEmployee(null)
      }
      setLoading(false)
    })

    return () => {
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
