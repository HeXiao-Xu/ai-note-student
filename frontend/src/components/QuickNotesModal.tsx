import { useState } from 'react'
import type { QuickNotesResponse } from '../types/review'

interface QuickNotesModalProps {
  data: QuickNotesResponse
  onClose: () => void
  onSave: () => void
  saving: boolean
}

export default function QuickNotesModal({ data, onClose, onSave, saving }: QuickNotesModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(data.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4 animate-fade-in">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-slate-800">速记版笔记</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors rounded">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">{data.title}</h3>
          <div className="font-serif text-sm leading-[1.85] text-slate-700 whitespace-pre-wrap">
            {data.content}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {copied ? '已复制' : '复制内容'}
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? '保存中...' : '保存为笔记'}
          </button>
        </div>
      </div>
    </div>
  )
}
