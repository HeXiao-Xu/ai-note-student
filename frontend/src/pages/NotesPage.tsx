import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import VditorEditor from '../components/VditorEditor'
import { useNoteStore } from '../stores/noteStore'
import { useCourseStore } from '../stores/courseStore'
import ExamPointPanel from '../components/ExamPointPanel'
import QuickNotesModal from '../components/QuickNotesModal'
import * as noteAiApi from '../api/noteAi'
import type { QuickNotesResponse } from '../types/review'

export default function NotesPage() {
  const { notes, currentNote, loading, fetchAllNotes, fetchNote, createNote, importDocument, updateNote, deleteNote, setCurrentNote } = useNoteStore()
  const { courses } = useCourseStore()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [showNewNote, setShowNewNote] = useState(false)
  const [newCourseId, setNewCourseId] = useState<number>(0)
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'exam'>('content')
  const [quickNotes, setQuickNotes] = useState<QuickNotesResponse | null>(null)
  const [generatingQuickNotes, setGeneratingQuickNotes] = useState(false)
  const [savingQuickNotes, setSavingQuickNotes] = useState(false)
  const [courseFilter, setCourseFilter] = useState<number>(0)
  const [importing, setImporting] = useState(false)
  const [importCourseId, setImportCourseId] = useState<number>(0)
  const [showImportModal, setShowImportModal] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAllNotes()
  }, [fetchAllNotes])

  useEffect(() => {
    if (currentNote && isEditing) {
      setTitle(currentNote.title)
      setContent(currentNote.content)
      setTags(currentNote.tags?.join(', ') || '')
    }
  }, [currentNote?.id])

  // Filtered notes by course
  const filteredNotes = courseFilter === 0 ? notes : notes.filter((n) => n.course_id === courseFilter)

  const handleSelectNote = async (id: number) => {
    await fetchNote(id)
    setShowNewNote(false)
    setIsEditing(false)
    setActiveTab('content')
  }

  const handleNewNote = () => {
    if (courses.length === 0) return
    setNewCourseId(courses[0].id)
    setTitle('')
    setContent('')
    setTags('')
    setShowNewNote(true)
    setCurrentNote(null)
    setIsEditing(true)
  }

  const handleSaveNew = async () => {
    if (!title.trim()) return
    const note = await createNote(newCourseId, {
      title: title.trim(),
      content,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    })
    setShowNewNote(false)
    setIsEditing(false)
    await fetchNote(note.id)
  }

  const handleImportClick = () => {
    if (courses.length === 0) return
    setImportCourseId(courses[0].id)
    setShowImportModal(true)
  }

  const handleImportFile = async () => {
    if (!importInputRef.current?.files?.length) return
    const file = importInputRef.current.files[0]
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!['.pdf', '.pptx', '.docx'].includes(ext)) {
      alert('仅支持 PDF / PPTX / DOCX 格式')
      return
    }
    setImporting(true)
    try {
      const note = await importDocument(importCourseId, file)
      setShowImportModal(false)
      await fetchNote(note.id)
      fetchAllNotes()
    } catch {
      alert('导入失败，请重试')
    } finally {
      setImporting(false)
    }
  }

  const autoSave = useCallback(
    (noteId: number, data: { title?: string; content?: string; tags?: string[] }) => {
      if (saveTimer) clearTimeout(saveTimer)
      setSaving(true)
      const timer = setTimeout(async () => {
        await updateNote(noteId, data)
        setSaving(false)
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

  const handleGenerateQuickNotes = async () => {
    if (!currentNote) return
    setGeneratingQuickNotes(true)
    try {
      const result = await noteAiApi.generateQuickNotes(currentNote.id)
      setQuickNotes(result)
    } catch {
      alert('生成速记版失败，请重试')
    } finally {
      setGeneratingQuickNotes(false)
    }
  }

  const handleSaveQuickNotes = async () => {
    if (!quickNotes) return
    setSavingQuickNotes(true)
    try {
      setQuickNotes(null)
      fetchAllNotes()
    } finally {
      setSavingQuickNotes(false)
    }
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

  const getCourseName = (courseId: number) => courses.find((c) => c.id === courseId)?.name || ''
  const getCourseColor = (courseId: number) => courses.find((c) => c.id === courseId)?.color || '#6366f1'

  const fileTypeIcon: Record<string, string> = { pdf: '📄', pptx: '📊', docx: '📝' }

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400 text-sm">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Note list */}
      <div className="w-72 border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">全部笔记</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handleImportClick}
                disabled={courses.length === 0}
                className="flex items-center gap-1 text-xs px-2 py-1.5 text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                title="导入文档"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                导入
              </button>
              <button
                onClick={handleNewNote}
                disabled={courses.length === 0}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                title={courses.length === 0 ? '请先创建课程' : '新建笔记'}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                新建
              </button>
            </div>
          </div>
          {/* Course filter dropdown */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(Number(e.target.value))}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all"
          >
            <option value={0}>全部课程</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.map((note, i) => (
            <button
              key={note.id}
              onClick={() => handleSelectNote(note.id)}
              className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-all animate-fade-in ${
                currentNote?.id === note.id
                  ? 'bg-white border-l-2 border-l-indigo-500'
                  : 'hover:bg-white border-l-2 border-l-transparent'
              }`}
              style={{ animationDelay: `${i * 25}ms` }}
            >
              <div className="flex items-center gap-2">
                {note.file_type && <span className="text-sm shrink-0">{fileTypeIcon[note.file_type] || '📎'}</span>}
                <div className="text-sm font-medium text-slate-800 truncate">{note.title}</div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: getCourseColor(note.course_id) }}
                />
                <span className="text-[11px] text-slate-400">{getCourseName(note.course_id)}</span>
                <span className="text-[11px] text-slate-300">·</span>
                <span className="text-[11px] text-slate-400">{formatDate(note.updated_at)}</span>
              </div>
              {note.tags?.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {note.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-[10px] text-slate-400">+{note.tags.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          ))}
          {notes.length === 0 && courses.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-slate-400 text-sm mb-3">还没有课程</p>
              <Link to="/courses" className="text-xs text-indigo-600 hover:text-indigo-500 transition-colors font-medium">
                去创建课程 →
              </Link>
            </div>
          )}
          {notes.length === 0 && courses.length > 0 && (
            <div className="p-6 text-center">
              <p className="text-slate-400 text-sm">暂无笔记</p>
            </div>
          )}
          {notes.length > 0 && filteredNotes.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-slate-400 text-sm">该课程暂无笔记</p>
            </div>
          )}
        </div>
      </div>

      {/* Note detail / editor */}
      <div className="flex-1 overflow-y-auto bg-white">
        {showNewNote ? (
          <div className="max-w-2xl mx-auto px-8 py-10 animate-fade-in">
            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">所属课程</label>
              <select
                value={newCourseId}
                onChange={(e) => setNewCourseId(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="笔记标题"
              className="w-full text-2xl font-bold border-none outline-none mb-6 placeholder:text-slate-300 text-slate-900 bg-transparent"
            />
            <VditorEditor
              value={content}
              onChange={(val) => setContent(val)}
            />
            <div className="mt-4">
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="标签（逗号分隔）"
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={handleSaveNew} className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                保存
              </button>
              <button onClick={() => { setShowNewNote(false); setIsEditing(false) }} className="px-5 py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors">
                取消
              </button>
            </div>
          </div>
        ) : currentNote ? (
          <div className="max-w-2xl mx-auto px-8 py-10 animate-fade-in">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full text-2xl font-bold border-none outline-none mb-6 text-slate-900 bg-transparent"
                />
                <VditorEditor
                  value={content}
                  onChange={(val) => handleContentChange(val)}
                />
                <div className="mt-4">
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="标签（逗号分隔）"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {saving ? (
                    <span className="flex items-center gap-1.5 text-xs text-indigo-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-[pulse-dot_1.5s_ease-in-out_infinite]" />
                      自动保存中...
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">自动保存已开启</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {currentNote.file_type && <span className="text-lg">{fileTypeIcon[currentNote.file_type] || '📎'}</span>}
                    <h1 className="text-2xl font-bold text-slate-900">{currentNote.title}</h1>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {currentNote.file_type === 'pdf' && (
                      <button
                        onClick={() => {
                          const token = localStorage.getItem('access_token')
                          window.open(`/api/notes/${currentNote.id}/document?token=${token}`, '_blank')
                        }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors font-medium"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        查看文档
                      </button>
                    )}
                    {currentNote.file_type && currentNote.file_type !== 'pdf' && (
                      <button
                        onClick={() => {
                          const token = localStorage.getItem('access_token')
                          const a = document.createElement('a')
                          a.href = `/api/notes/${currentNote.id}/document?token=${token}`
                          a.download = currentNote.title + '.' + currentNote.file_type
                          a.click()
                        }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors font-medium"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        下载文档
                      </button>
                    )}
                    <button
                      onClick={handleGenerateQuickNotes}
                      disabled={generatingQuickNotes}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      {generatingQuickNotes ? '生成中...' : '速记版'}
                    </button>
                    <button onClick={handleEditNote} className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="编辑">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button onClick={handleDeleteNote} className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors" title="删除">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4 text-xs text-slate-400">
                  <span>{formatDate(currentNote.updated_at)}</span>
                  {currentNote.tags?.length > 0 && (
                    <div className="flex gap-1.5">
                      {currentNote.tags.map((tag) => (
                        <span key={tag} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-slate-200 mb-5">
                  {([
                    { key: 'content', label: '笔记内容' },
                    { key: 'exam', label: '考点分析' },
                  ] as const).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                        activeTab === tab.key
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {activeTab === 'content' && (
                  <div className="animate-fade-in">
                    {currentNote.file_type ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-2xl">{fileTypeIcon[currentNote.file_type] || '📎'}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-700">{currentNote.title}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {currentNote.file_type.toUpperCase()} 文档
                            </div>
                          </div>
                          {currentNote.file_type === 'pdf' ? (
                            <button
                              onClick={() => {
                                const token = localStorage.getItem('access_token')
                                window.open(`/api/notes/${currentNote.id}/document?token=${token}`, '_blank')
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                            >
                              查看文档
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const token = localStorage.getItem('access_token')
                                const a = document.createElement('a')
                                a.href = `/api/notes/${currentNote.id}/document?token=${token}`
                                a.download = currentNote.title + '.' + currentNote.file_type
                                a.click()
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                            >
                              下载文档
                            </button>
                          )}
                        </div>
                        {currentNote.content ? (
                          <MDEditor.Markdown source={currentNote.content} />
                        ) : (
                          <p className="text-slate-400 text-sm italic">点击上方按钮查看完整文档内容</p>
                        )}
                      </div>
                    ) : (
                      currentNote.content ? (
                        <MDEditor.Markdown source={currentNote.content} />
                      ) : (
                        <span className="text-slate-300 italic">空内容</span>
                      )
                    )}
                  </div>
                )}

                {activeTab === 'exam' && (
                  <div className="animate-fade-in">
                    <ExamPointPanel noteId={currentNote.id} />
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm text-slate-400">选择或创建一篇笔记</p>
          </div>
        )}
      </div>

      {/* Import document modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowImportModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-800 mb-4">导入文档为笔记</h3>
            <div className="mb-4">
              <label className="block text-xs text-slate-500 mb-1.5">所属课程</label>
              <select
                value={importCourseId}
                onChange={(e) => setImportCourseId(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-slate-500 mb-1.5">选择文档</label>
              <input
                ref={importInputRef}
                type="file"
                accept=".pdf,.pptx,.docx"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">支持 PDF / PPTX / DOCX，最大 50MB</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowImportModal(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
              <button
                onClick={handleImportFile}
                disabled={importing}
                className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
              >
                {importing ? '导入中...' : '导入'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Notes Modal */}
      {quickNotes && (
        <QuickNotesModal
          data={quickNotes}
          onClose={() => setQuickNotes(null)}
          onSave={handleSaveQuickNotes}
          saving={savingQuickNotes}
        />
      )}
    </div>
  )
}
