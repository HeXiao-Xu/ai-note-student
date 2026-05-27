import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import { useAuthStore } from '../../stores/authStore'

export default function Sidebar() {
  const { courses, currentCourseId, fetchCourses, setCurrentCourse } = useCourseStore()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleCourseClick = (courseId: number) => {
    setCurrentCourse(courseId)
    navigate(`/courses/${courseId}/notes`)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100">
        <NavLink to="/notes" className="text-lg font-bold text-indigo-600">
          AI Note
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="px-2 py-2 space-y-1">
        <NavLink
          to="/notes"
          className={({ isActive }) =>
            `block px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`
          }
        >
          全部笔记
        </NavLink>
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `block px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`
          }
        >
          搜索
        </NavLink>
      </nav>

      {/* Course list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 border-t border-gray-100">
        <div className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
          课程
        </div>
        {courses.map((course) => (
          <button
            key={course.id}
            onClick={() => handleCourseClick(course.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
              currentCourseId === course.id
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: course.color || '#6366f1' }}
            />
            <span className="truncate">{course.name}</span>
          </button>
        ))}
      </div>

      {/* User */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-600 truncate">
          {useAuthStore.getState().user?.username}
        </span>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          退出
        </button>
      </div>
    </aside>
  )
}
