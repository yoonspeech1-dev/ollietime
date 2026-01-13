import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import CalendarPage from './pages/CalendarPage'
import RecordsPage from './pages/RecordsPage'
import './App.css'

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/records" element={<RecordsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
