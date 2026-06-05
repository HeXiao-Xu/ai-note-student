import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

import AuthLayout from './components/layout/AuthLayout'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotesPage from './pages/NotesPage'
import CourseNotesPage from './pages/CourseNotesPage'
import CoursesPage from './pages/CoursesPage'
import SearchPage from './pages/SearchPage'
import WrongQuestionsPage from './pages/WrongQuestionsPage'
import ReviewPage from './pages/ReviewPage'
import ReviewStatsPage from './pages/ReviewStatsPage'
import KnowledgeGraphPage from './pages/KnowledgeGraphPage'
import QAPage from './pages/QAPage'

function App() {
  const initAuth = useAuthStore((s) => s.initAuth)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes - accessible only when not logged in */}
        <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* App routes - require authentication */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/courses/:courseId/notes" element={<CourseNotesPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/wrong-questions" element={<WrongQuestionsPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/review/stats" element={<ReviewStatsPage />} />
          <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
          <Route path="/qa" element={<QAPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/notes" replace />} />
        <Route path="*" element={<Navigate to="/notes" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
