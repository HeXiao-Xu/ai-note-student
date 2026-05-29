import { useState } from 'react'
import type { WrongQuestion } from '../types/wrongQuestion'

interface WrongQuestionFormProps {
  initial?: WrongQuestion | null
  onSubmit: (data: { question: string; answer?: string; my_answer?: string; error_type?: string }) => Promise<void>
  onUploadImage?: (id: number, file: File) => Promise<void>
  onCancel: () => void
  submitting: boolean
}

const errorTypes = ['计算', '概念', '审题', '记忆', '其他']

export default function WrongQuestionForm({ initial, onSubmit, onUploadImage, onCancel, submitting }: WrongQuestionFormProps) {
  const [question, setQuestion] = useState(initial?.question || '')
  const [answer, setAnswer] = useState(initial?.answer || '')
  const [myAnswer, setMyAnswer] = useState(initial?.my_answer || '')
  const [errorType, setErrorType] = useState(initial?.error_type || '其他')

  const isEdit = !!initial

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    if (isEdit) {
      await onSubmit({
        question: question.trim(),
        answer: answer.trim() || undefined,
        my_answer: myAnswer.trim() || undefined,
        error_type: errorType,
      })
    } else {
      await onSubmit({
        question: question.trim(),
        answer: answer.trim() || undefined,
        my_answer: myAnswer.trim() || undefined,
        error_type: errorType,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">题目 *</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="输入题目内容"
          rows={3}
          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">正确答案</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="输入正确答案"
          rows={2}
          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">我的答案</label>
        <textarea
          value={myAnswer}
          onChange={(e) => setMyAnswer(e.target.value)}
          placeholder="输入你的答案（用于对比分析）"
          rows={2}
          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">错误类型</label>
        <div className="flex flex-wrap gap-2">
          {errorTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setErrorType(t)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                errorType === t
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200 font-medium'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Image upload for existing question */}
      {isEdit && initial && onUploadImage && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">题目图片</label>
          {initial.image_url ? (
            <div className="relative inline-block">
              <img src={initial.image_url} alt="题目图片" className="max-h-40 rounded-lg border border-slate-200" />
            </div>
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) await onUploadImage(initial.id, file)
              }}
              className="text-sm text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 file:cursor-pointer"
            />
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || !question.trim()}
          className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? '提交中...' : isEdit ? '更新' : '添加'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  )
}
