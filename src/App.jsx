import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import CalendarPage from './pages/CalendarPage'
import RecordsPage from './pages/RecordsPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import EmployeeRecords from './pages/admin/EmployeeRecords'
import MemberManagement from './pages/admin/MemberManagement'
import './App.css'

function AppContent() {
  return (
    <Routes>
      {/* 공개 라우트 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* 인증 필요 라우트 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div className="app">
              <Header />
              <main className="main-content">
                <CalendarPage />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/records"
        element={
          <ProtectedRoute>
            <div className="app">
              <Header />
              <main className="main-content">
                <RecordsPage />
              </main>
            </div>
          </ProtectedRoute>
        }
      />

      {/* 관리자 전용 라우트 */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <div className="app">
              <Header />
              <main className="main-content">
                <AdminDashboard />
              </main>
            </div>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/employees/:id"
        element={
          <AdminRoute>
            <div className="app">
              <Header />
              <main className="main-content">
                <EmployeeRecords />
              </main>
            </div>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/members"
        element={
          <AdminRoute>
            <div className="app">
              <Header />
              <main className="main-content">
                <MemberManagement />
              </main>
            </div>
          </AdminRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
