import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import { useAuthStore } from '../../stores/authStore'

export default function Sidebar() {
  const { courses, currentCourseId, fetchCourses, setCurrentCourse } = useCourseStore()
  const { user, logout } = useAuthStore()
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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <NavLink to="/notes" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center group-hover:bg-teal-500/25 transition-colors">
            <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-100 font-serif tracking-tight">AI Note</span>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-3 space-y-0.5">
        <NavLink
          to="/notes"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              isActive
                ? 'bg-teal-500/10 text-teal-400 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`
          }
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          全部笔记
        </NavLink>
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              isActive
                ? 'bg-teal-500/10 text-teal-400 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`
          }
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          搜索
        </NavLink>
        <NavLink
          to="/courses"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              isActive
                ? 'bg-teal-500/10 text-teal-400 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`
          }
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
          </svg>
          课程管理
        </NavLink>
      </nav>

      {/* Course list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 border-t border-slate-800">
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">课程</span>
        </div>
        {courses.length === 0 && (
          <p className="px-3 text-xs text-slate-600">暂无课程</p>
        )}
        {courses.map((course) => (
          <button
            key={course.id}
            onClick={() => handleCourseClick(course.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2.5 mb-0.5 ${
              currentCourseId === course.id
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-slate-900"
              style={{
                backgroundColor: course.color || '#14b8a6',
                '--tw-ring-color': currentCourseId === course.id ? (course.color || '#14b8a6') : 'transparent',
              } as React.CSSProperties}
            />
            <span className="truncate">{course.name}</span>
          </button>
        ))}
      </div>

      {/* User */}
      <div className="px-4 py-3 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-teal-400 shrink-0">
            {user?.username?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-300 truncate">{user?.username}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-400 transition-colors p-1"
            title="退出登录"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
