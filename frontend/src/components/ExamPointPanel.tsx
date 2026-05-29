import { useEffect } from 'react'
import { useExamPointStore } from '../stores/examPointStore'

interface ExamPointPanelProps {
  noteId: number
}

const frequencyColors: Record<string, string> = {
  '高频': 'bg-rose-50 text-rose-600 border-rose-200',
  '中频': 'bg-amber-50 text-amber-600 border-amber-200',
  '低频': 'bg-emerald-50 text-emerald-600 border-emerald-200',
}

export default function ExamPointPanel({ noteId }: ExamPointPanelProps) {
  const { examPoints, loading, error, fetchExamPoints, analyzeExamPoints, clearExamPoints } = useExamPointStore()

  useEffect(() => {
    fetchExamPoints(noteId)
    return () => clearExamPoints()
  }, [noteId, fetchExamPoints, clearExamPoints])

  const handleAnalyze = async () => {
    try {
      await analyzeExamPoints(noteId)
    } catch {
      // error is set in store
    }
  }

  return (
    <div className="mt-6 pt-5 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">考点分析</h3>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          {loading ? 'AI分析中...' : 'AI分析'}
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-500 mb-2">{error}</div>
      )}

      {examPoints.length === 0 && !loading && (
        <p className="text-xs text-slate-400">暂无考点，点击 AI分析 自动提取</p>
      )}

      {loading && examPoints.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          正在分析考点...
        </div>
      )}

      <div className="space-y-2">
        {examPoints.map((point) => (
          <div key={point.id} className="bg-white border border-slate-100 rounded-lg px-3 py-2.5 animate-fade-in">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-slate-700 leading-relaxed">{point.content}</p>
              <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded border font-medium ${frequencyColors[point.frequency] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                {point.frequency}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              {point.source && (
                <span className="text-[11px] text-slate-400">来源: {point.source}</span>
              )}
              {point.exam_years?.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  考查年份: {point.exam_years.join(', ')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
