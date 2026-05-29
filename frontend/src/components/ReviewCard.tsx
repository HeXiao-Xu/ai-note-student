import { useState } from 'react'
import type { ReviewItem } from '../types/review'

interface ReviewCardProps {
  item: ReviewItem
  onAnswer: (planId: number, quality: number) => Promise<void>
}

const qualityLabels = [
  { value: 0, label: '完全不会', color: 'bg-rose-500 hover:bg-rose-600' },
  { value: 1, label: '有印象', color: 'bg-orange-500 hover:bg-orange-600' },
  { value: 2, label: '模糊', color: 'bg-amber-500 hover:bg-amber-600' },
  { value: 3, label: '基本掌握', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { value: 4, label: '熟练', color: 'bg-teal-500 hover:bg-teal-600' },
  { value: 5, label: '完全掌握', color: 'bg-indigo-500 hover:bg-indigo-600' },
]

export default function ReviewCard({ item, onAnswer }: ReviewCardProps) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [answering, setAnswering] = useState(false)

  const handleAnswer = async (quality: number) => {
    setAnswering(true)
    try {
      await onAnswer(item.plan_id, quality)
    } finally {
      setAnswering(false)
    }
  }

  const refTypeLabel = item.ref_type === 'exam_point' ? '考点' : '错题'
  const refTypeColor = item.ref_type === 'exam_point' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${refTypeColor}`}>
            {refTypeLabel}
          </span>
          <span className="text-xs text-slate-400">复习次数: {item.review_count}</span>
        </div>
        <span className="text-xs text-slate-400">{item.note_title}</span>
      </div>

      <div className="px-5 py-5">
        <div className="font-serif text-sm leading-[1.85] text-slate-700 whitespace-pre-wrap mb-4">
          {item.content}
        </div>

        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
          >
            显示答案 →
          </button>
        ) : (
          <div className="animate-fade-in">
            <div className="text-xs font-medium text-slate-500 mb-2">你对这个内容的掌握程度：</div>
            <div className="flex flex-wrap gap-2">
              {qualityLabels.map((q) => (
                <button
                  key={q.value}
                  onClick={() => handleAnswer(q.value)}
                  disabled={answering}
                  className={`${q.color} text-white text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
