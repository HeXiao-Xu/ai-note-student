import { useEffect, useState, useRef } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { useQAStore } from '../stores/qaStore'
import { useCourseStore } from '../stores/courseStore'

export default function QAPage() {
  const {
    sessions, currentSessionId, messages, asking, loadingSessions, loadingMessages, error,
    fetchSessions, selectSession, newSession, askQuestion, deleteSession, renameSession, clearError,
  } = useQAStore()
  const { courses } = useCourseStore()

  const [courseId, setCourseId] = useState<number>(0)
  const [question, setQuestion] = useState('')
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSessions(courseId || undefined)
  }, [courseId, fetchSessions])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleAsk = async () => {
    if (!question.trim() || asking) return
    const q = question.trim()
    setQuestion('')
    await askQuestion(q, courseId || undefined)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  const handleNewSession = () => {
    newSession()
  }

  const handleDeleteSession = (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation()
    if (confirm('确定删除此会话？')) {
      deleteSession(sessionId)
    }
  }

  const handleStartRename = (e: React.MouseEvent, sessionId: number, currentTitle: string) => {
    e.stopPropagation()
    setEditingSessionId(sessionId)
    setEditTitle(currentTitle)
  }

  const handleFinishRename = (sessionId: number) => {
    if (editTitle.trim()) {
      renameSession(sessionId, editTitle.trim())
    }
    setEditingSessionId(null)
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex h-full">
      {/* Left: Sessions list */}
      <div className="w-72 border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">问答会话</h2>
            <button
              onClick={handleNewSession}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              新建
            </button>
          </div>
          <select
            value={courseId}
            onChange={(e) => setCourseId(Number(e.target.value))}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all"
          >
            <option value={0}>全部课程</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-slate-400">暂无会话</p>
              <p className="text-[11px] text-slate-400 mt-1">点击"新建"开始提问</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => selectSession(session.id)}
                  className={`px-4 py-3 cursor-pointer group transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-white border-l-2 border-l-indigo-500'
                      : 'hover:bg-white border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {editingSessionId === session.id ? (
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleFinishRename(session.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFinishRename(session.id)
                          if (e.key === 'Escape') setEditingSessionId(null)
                        }}
                        className="flex-1 text-xs bg-white border border-indigo-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <p className="text-xs font-medium text-slate-700 truncate flex-1">{session.title}</p>
                    )}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => handleStartRename(e, session.id, session.title)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        title="重命名"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                        title="删除"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{formatDate(session.updated_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-200 shrink-0 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">智能问答</h1>
          {currentSessionId && (
            <span className="text-xs text-slate-400">
              会话 #{currentSessionId}
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 py-2 bg-rose-50 text-rose-600 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-rose-400 hover:text-rose-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              <p className="text-sm text-slate-400">输入问题开始智能问答</p>
              <p className="text-xs text-slate-400 mt-1">AI 将基于你的笔记内容回答</p>
            </div>
          ) : (
            messages.map((msg) => (
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[70%] bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              ) : msg.loading ? (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-[70%] bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-md text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      <span>正在思考...</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-[70%] bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm text-slate-700 leading-relaxed">
                    <MDEditor.Markdown source={msg.content} />
                    {/* Source notes */}
                    {msg.sourceNotes && msg.sourceNotes.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100">
                        <p className="text-[11px] text-slate-400 mb-1.5">引用笔记：</p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sourceNotes.map((sn) => (
                            <span
                              key={sn.id}
                              className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full"
                            >
                              {sn.title}
                              {sn.relevance > 0 && (
                                <span className="ml-1 text-indigo-400">{(sn.relevance * 100).toFixed(0)}%</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Source entities */}
                    {msg.sourceEntities && msg.sourceEntities.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[11px] text-slate-400 mb-1.5">相关实体：</p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sourceEntities.map((se) => (
                            <span
                              key={se.id}
                              className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full"
                            >
                              {se.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            ))
          )}
          <div ref={messagesEndRef} />
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="px-6 py-3 border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题..."
              disabled={asking}
              className="flex-1 text-sm border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              onClick={handleAsk}
              disabled={!question.trim() || asking}
              className="flex items-center gap-1.5 text-xs px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {asking ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
              {asking ? '思考中...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
