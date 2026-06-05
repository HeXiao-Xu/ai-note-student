import { useEffect, useState, useRef } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { useQAStore } from '../stores/qaStore'
import { useCourseStore } from '../stores/courseStore'

export default function QAPage() {
  const {
    conversations, currentResult, lastQuestion, asking, loading, error,
    askQuestion, fetchHistory, clearError,
  } = useQAStore()
  const { courses } = useCourseStore()

  const [courseId, setCourseId] = useState<number>(0)
  const [question, setQuestion] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchHistory(courseId || undefined)
  }, [courseId, fetchHistory])

  useEffect(() => {
    if (currentResult) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentResult])

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

  const hasContent = currentResult || conversations.length > 0

  return (
    <div className="flex h-full">
      {/* Left: Q&A conversation */}
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900">智能问答</h1>
            <select
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
              className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-500"
            >
              <option value={0}>全部课程</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

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
          {!hasContent && (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              <p className="text-sm text-slate-400">输入问题开始智能问答</p>
              <p className="text-xs text-slate-400 mt-1">AI 将基于你的笔记内容回答</p>
            </div>
          )}

          {currentResult && (
            <>
              {/* User question */}
              <div className="flex justify-end">
                <div className="max-w-[70%] bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed">
                  {lastQuestion}
                </div>
              </div>
              {/* AI answer */}
              <div className="flex justify-start">
                <div className="max-w-[70%] bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm text-slate-700 leading-relaxed">
                  <MDEditor.Markdown source={currentResult.answer} />
                  {/* Source notes */}
                  {currentResult.source_notes.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <p className="text-[11px] text-slate-400 mb-1.5">引用笔记：</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentResult.source_notes.map((sn) => (
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
                  {currentResult.source_entities.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[11px] text-slate-400 mb-1.5">相关实体：</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentResult.source_entities.map((se) => (
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
            </>
          )}
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

      {/* Right: History panel */}
      <div className="w-80 border-l border-slate-200 bg-slate-50/50 flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">问答历史</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-slate-400">暂无问答历史</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.map((conv) => (
                <div key={conv.id} className="px-4 py-3">
                  <button
                    onClick={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
                    className="w-full text-left"
                  >
                    <p className="text-xs font-medium text-slate-700 truncate">{conv.question}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {new Date(conv.created_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                  {expandedId === conv.id && (
                    <div className="mt-2">
                      <div className="text-xs text-slate-600 leading-relaxed">
                        <MDEditor.Markdown source={conv.answer} />
                      </div>
                      {conv.source_note_ids && conv.source_note_ids.length > 0 && (
                        <p className="text-[11px] text-slate-400 mt-2">
                          引用了 {conv.source_note_ids.length} 条笔记
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
