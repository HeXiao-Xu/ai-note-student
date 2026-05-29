import { useEffect, useState } from 'react'
import { useWrongQuestionStore } from '../stores/wrongQuestionStore'
import WrongQuestionForm from '../components/WrongQuestionForm'
import type { CreateWrongQuestionRequest, UpdateWrongQuestionRequest } from '../types/wrongQuestion'

const errorTypeColors: Record<string, string> = {
  '计算': 'bg-blue-50 text-blue-600',
  '概念': 'bg-purple-50 text-purple-600',
  '审题': 'bg-amber-50 text-amber-600',
  '记忆': 'bg-emerald-50 text-emerald-600',
  '其他': 'bg-slate-50 text-slate-600',
}

export default function WrongQuestionsPage() {
  const {
    items, total, page, loading, currentQuestion,
    fetchWrongQuestions, createWrongQuestion, updateWrongQuestion,
    deleteWrongQuestion, uploadImage, analyze, setCurrentQuestion,
  } = useWrongQuestionStore()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<{ root_cause: string; knowledge_gaps: string[]; suggestion: string } | null>(null)

  useEffect(() => {
    fetchWrongQuestions({ page: 1, page_size: 20 })
  }, [fetchWrongQuestions])

  const handleCreate = async (data: CreateWrongQuestionRequest) => {
    setSubmitting(true)
    try {
      await createWrongQuestion(data)
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (data: UpdateWrongQuestionRequest) => {
    if (!editingId) return
    setSubmitting(true)
    try {
      await updateWrongQuestion(editingId, data)
      setEditingId(null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该错题？')) return
    await deleteWrongQuestion(id)
    if (currentQuestion?.id === id) setCurrentQuestion(null)
  }

  const handleAnalyze = async (id: number) => {
    setAnalyzing(true)
    setAnalysisResult(null)
    try {
      const result = await analyze(id)
      setAnalysisResult(result)
    } catch {
      alert('AI分析失败，请重试')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleUploadImage = async (id: number, file: File) => {
    await uploadImage(id, file)
  }

  const handlePageChange = (newPage: number) => {
    fetchWrongQuestions({ page: newPage, page_size: 20 })
  }

  return (
    <div className="flex h-full">
      {/* Left panel: List */}
      <div className="w-80 border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold text-slate-800">错题本</h2>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setCurrentQuestion(null) }}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            添加
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-slate-400 text-sm">暂无错题</p>
            </div>
          ) : (
            items.map((q) => (
              <button
                key={q.id}
                onClick={() => { setCurrentQuestion(q); setEditingId(null); setShowForm(false); setAnalysisResult(null) }}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-all ${
                  currentQuestion?.id === q.id
                    ? 'bg-white border-l-2 border-l-indigo-500'
                    : 'hover:bg-white border-l-2 border-l-transparent'
                }`}
              >
                <div className="text-sm text-slate-700 line-clamp-2">{q.question}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${errorTypeColors[q.error_type] || errorTypeColors['其他']}`}>
                    {q.error_type}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    掌握度: {q.mastery}/5
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="px-4 py-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="hover:text-slate-600 disabled:opacity-40"
            >
              上一页
            </button>
            <span>{page} / {Math.ceil(total / 20)}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="hover:text-slate-600 disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* Right panel: Detail / Form */}
      <div className="flex-1 overflow-y-auto bg-white">
        {showForm && !editingId ? (
          <div className="max-w-xl mx-auto px-8 py-8 animate-fade-in">
            <h3 className="text-base font-semibold text-slate-800 mb-4">添加错题</h3>
            <WrongQuestionForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              submitting={submitting}
            />
          </div>
        ) : editingId && currentQuestion ? (
          <div className="max-w-xl mx-auto px-8 py-8 animate-fade-in">
            <h3 className="text-base font-semibold text-slate-800 mb-4">编辑错题</h3>
            <WrongQuestionForm
              initial={currentQuestion}
              onSubmit={handleUpdate}
              onUploadImage={handleUploadImage}
              onCancel={() => setEditingId(null)}
              submitting={submitting}
            />
          </div>
        ) : currentQuestion ? (
          <div className="max-w-2xl mx-auto px-8 py-8 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${errorTypeColors[currentQuestion.error_type] || errorTypeColors['其他']}`}>
                  {currentQuestion.error_type}
                </span>
                <span className="text-xs text-slate-400">掌握度: {currentQuestion.mastery}/5</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingId(currentQuestion.id)}
                  className="p-2 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="编辑"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(currentQuestion.id)}
                  className="p-2 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  title="删除"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-slate-500 mb-1">题目</h4>
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{currentQuestion.question}</div>
              </div>

              {currentQuestion.image_url && (
                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-1">题目图片</h4>
                  <img src={currentQuestion.image_url} alt="题目" className="max-h-60 rounded-lg border border-slate-200" />
                </div>
              )}

              {currentQuestion.answer && (
                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-1">正确答案</h4>
                  <div className="text-sm text-emerald-700 whitespace-pre-wrap leading-relaxed bg-emerald-50/50 px-3 py-2 rounded-lg">{currentQuestion.answer}</div>
                </div>
              )}

              {currentQuestion.my_answer && (
                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-1">我的答案</h4>
                  <div className="text-sm text-rose-700 whitespace-pre-wrap leading-relaxed bg-rose-50/50 px-3 py-2 rounded-lg">{currentQuestion.my_answer}</div>
                </div>
              )}

              {/* AI Analysis */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-medium text-slate-500">AI 错题归因</h4>
                  <button
                    onClick={() => handleAnalyze(currentQuestion.id)}
                    disabled={analyzing}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    {analyzing ? '分析中...' : 'AI分析'}
                  </button>
                </div>

                {analyzing && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    正在分析...
                  </div>
                )}

                {analysisResult && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                      <div className="text-xs font-medium text-slate-600 mb-1">根本原因</div>
                      <div className="text-sm text-slate-700">{analysisResult.root_cause}</div>
                    </div>
                    {analysisResult.knowledge_gaps?.length > 0 && (
                      <div className="bg-amber-50/50 rounded-lg px-3 py-2.5">
                        <div className="text-xs font-medium text-amber-600 mb-1">知识漏洞</div>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {analysisResult.knowledge_gaps.map((gap, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-500 mt-0.5">•</span>
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="bg-indigo-50/50 rounded-lg px-3 py-2.5">
                      <div className="text-xs font-medium text-indigo-600 mb-1">改进建议</div>
                      <div className="text-sm text-slate-700">{analysisResult.suggestion}</div>
                    </div>
                  </div>
                )}

                {currentQuestion.analysis && !analysisResult && (
                  <div className="text-sm text-slate-600 whitespace-pre-wrap">{currentQuestion.analysis}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-slate-400">选择或添加一道错题</p>
          </div>
        )}
      </div>
    </div>
  )
}
