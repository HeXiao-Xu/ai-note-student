import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNoteStore } from '../stores/noteStore'
import { useCourseStore } from '../stores/courseStore'

export default function CourseNotesPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { notes, currentNote, loading, fetchNotesByCourse, fetchNote, createNote, updateNote, deleteNote, setCurrentNote } = useNoteStore()
  const { courses } = useCourseStore()
  const course = courses.find((c) => c.id === Number(courseId))

  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [showNewNote, setShowNewNote] = useState(false)
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (courseId) {
      fetchNotesByCourse(Number(courseId))
      setCurrentNote(null)
    }
  }, [courseId, fetchNotesByCourse, setCurrentNote])

  const handleSelectNote = async (id: number) => {
    await fetchNote(id)
    setShowNewNote(false)
  }

  const handleNewNote = () => {
    setTitle('')
    setContent('')
    setTags('')
    setShowNewNote(true)
    setCurrentNote(null)
    setIsEditing(true)
  }

  const handleSaveNew = async () => {
    if (!title.trim() || !courseId) return
    const note = await createNote(Number(courseId), {
      title: title.trim(),
      content,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    })
    setShowNewNote(false)
    setIsEditing(false)
    await fetchNote(note.id)
  }

  const autoSave = useCallback(
    (noteId: number, data: { title?: string; content?: string; tags?: string[] }) => {
      if (saveTimer) clearTimeout(saveTimer)
      const timer = setTimeout(async () => {
        await updateNote(noteId, data)
      }, 1500)
      setSaveTimer(timer)
    },
    [saveTimer, updateNote],
  )

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (currentNote) autoSave(currentNote.id, { title: value.trim() || undefined })
  }

  const handleContentChange = (value: string) => {
    setContent(value)
    if (currentNote) autoSave(currentNote.id, { content: value })
  }

  const handleTagsChange = (value: string) => {
    setTags(value)
    if (currentNote) {
      autoSave(currentNote.id, { tags: value ? value.split(',').map((t) => t.trim()).filter(Boolean) : [] })
    }
  }

  const handleEditNote = () => {
    if (currentNote) {
      setTitle(currentNote.title)
      setContent(currentNote.content)
      setTags(currentNote.tags?.join(', ') || '')
      setIsEditing(true)
    }
  }

  const handleDeleteNote = async () => {
    if (!currentNote) return
    if (confirm('确定删除该笔记？')) {
      await deleteNote(currentNote.id)
      setIsEditing(false)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleString('zh-CN')

  if (!course) {
    return <div className="p-6 text-gray-400">课程不存在 <button onClick={() => navigate('/notes')} className="text-indigo-600">返回</button></div>
  }

  return (
    <div className="flex h-full">
      {/* Note list */}
      <div className="w-72 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <button onClick={() => navigate('/notes')} className="text-xs text-gray-400 hover:text-gray-600 mb-2">&larr; 全部笔记</button>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color || '#6366f1' }} />
            <h2 className="text-sm font-semibold text-gray-700 truncate">{course.name}</h2>
          </div>
          <button
            onClick={handleNewNote}
            className="mt-2 text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            新建笔记
          </button>
        </div>
        {loading && <p className="p-4 text-xs text-gray-400">加载中...</p>}
        {notes.map((note) => (
          <button
            key={note.id}
            onClick={() => handleSelectNote(note.id)}
            className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${
              currentNote?.id === note.id ? 'bg-indigo-50' : ''
            }`}
          >
            <div className="text-sm font-medium text-gray-900 truncate">{note.title}</div>
            <div className="text-xs text-gray-400 mt-1">{formatDate(note.updated_at)}</div>
          </button>
        ))}
        {!loading && notes.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">暂无笔记</p>
        )}
      </div>

      {/* Note detail / editor */}
      <div className="flex-1 overflow-y-auto">
        {showNewNote ? (
          <div className="p-6 max-w-3xl">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="笔记标题"
              className="w-full text-xl font-bold border-none outline-none mb-4 placeholder:text-gray-300"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="开始写作..."
              rows={20}
              className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
            <div className="mt-3">
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="标签（逗号分隔）"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={handleSaveNew} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">保存</button>
              <button onClick={() => { setShowNewNote(false); setIsEditing(false) }} className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800">取消</button>
            </div>
          </div>
        ) : currentNote ? (
          <div className="p-6 max-w-3xl">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full text-xl font-bold border-none outline-none mb-4"
                />
                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={20}
                  className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
                <div className="mt-3">
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="标签（逗号分隔）"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">自动保存已开启</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">{currentNote.title}</h1>
                  <div className="flex gap-2">
                    <button onClick={handleEditNote} className="text-sm text-indigo-600 hover:text-indigo-800">编辑</button>
                    <button onClick={handleDeleteNote} className="text-sm text-red-500 hover:text-red-700">删除</button>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-4">
                  {formatDate(currentNote.updated_at)}
                  {currentNote.tags?.length > 0 && (
                    <span className="ml-3">
                      {currentNote.tags.map((tag) => (
                        <span key={tag} className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mr-1">{tag}</span>
                      ))}
                    </span>
                  )}
                </div>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                  {currentNote.content || '(空内容)'}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            选择或创建一篇笔记
          </div>
        )}
      </div>
    </div>
  )
}
