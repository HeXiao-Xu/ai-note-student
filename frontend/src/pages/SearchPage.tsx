import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNoteStore } from '../stores/noteStore'
import { useCourseStore } from '../stores/courseStore'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const { searchResults, loading, searchNotes, clearSearch } = useNoteStore()
  const { courses } = useCourseStore()
  const navigate = useNavigate()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      await searchNotes(query.trim())
    }
  }

  const handleClear = () => {
    setQuery('')
    clearSearch()
  }

  const getCourseName = (courseId: number) => {
    return courses.find((c) => c.id === courseId)?.name || ''
  }

  const getCourseColor = (courseId: number) => {
    return courses.find((c) => c.id === courseId)?.color || '#14b8a6'
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 font-serif">搜索笔记</h1>
        <p className="text-slate-500 text-sm mt-1">在所有课程中查找笔记</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入关键词搜索标题或内容..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-24 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-colors"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {searchResults.length > 0 && (
              <button type="button" onClick={handleClear} className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                清除
              </button>
            )}
            <button type="submit" className="px-4 py-1.5 bg-teal-500 text-slate-950 text-xs font-semibold rounded-lg hover:bg-teal-400 transition-colors">
              搜索
            </button>
          </div>
        </div>
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-[pulse-dot_1.5s_ease-in-out_infinite]" />
          搜索中...
        </div>
      )}

      <div className="space-y-3">
        {searchResults.map((note, i) => (
          <button
            key={note.id}
            onClick={() => navigate(`/courses/${note.course_id}/notes`)}
            className="w-full text-left glass-card rounded-xl p-5 hover:border-slate-600 transition-all animate-fade-in group"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5"
                style={{ backgroundColor: getCourseColor(note.course_id) }}
              >
                {getCourseName(note.course_id).charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-200 truncate group-hover:text-teal-300 transition-colors">{note.title}</h3>
                  <span className="text-xs text-slate-500 shrink-0">{formatDate(note.updated_at)}</span>
                </div>
                {getCourseName(note.course_id) && (
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{getCourseName(note.course_id)}</span>
                )}
                {note.content && (
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">{note.content.slice(0, 150)}</p>
                )}
                {note.tags?.length > 0 && (
                  <div className="flex gap-1.5 mt-2.5 flex-wrap">
                    {note.tags.map((tag) => (
                      <span key={tag} className="text-[11px] bg-slate-800/80 text-teal-400/70 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {!loading && searchResults.length === 0 && query && (
        <div className="text-center mt-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">未找到相关笔记</p>
          <p className="text-slate-600 text-xs mt-1">试试其他关键词</p>
        </div>
      )}

      {!loading && searchResults.length === 0 && !query && (
        <div className="text-center mt-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">输入关键词开始搜索</p>
        </div>
      )}
    </div>
  )
}
