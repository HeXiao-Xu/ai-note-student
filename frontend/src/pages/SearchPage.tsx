import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNoteStore } from '../stores/noteStore'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const { searchResults, loading, searchNotes, clearSearch } = useNoteStore()
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

  const formatDate = (d: string) => new Date(d).toLocaleString('zh-CN')

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">搜索笔记</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入关键词搜索标题或内容..."
          className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
          搜索
        </button>
        {searchResults.length > 0 && (
          <button type="button" onClick={handleClear} className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800">
            清除
          </button>
        )}
      </form>

      {loading && <p className="text-gray-400 text-sm">搜索中...</p>}

      <div className="space-y-3">
        {searchResults.map((note) => (
          <button
            key={note.id}
            onClick={() => navigate(`/courses/${note.course_id}/notes`)}
            className="w-full text-left bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">{note.title}</h3>
              <span className="text-xs text-gray-400">{formatDate(note.updated_at)}</span>
            </div>
            {note.content && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{note.content.slice(0, 150)}</p>
            )}
            {note.tags?.length > 0 && (
              <div className="flex gap-1 mt-2">
                {note.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {!loading && searchResults.length === 0 && query && (
        <p className="text-center text-gray-400 mt-8">未找到相关笔记</p>
      )}
    </div>
  )
}
