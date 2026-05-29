import { useState } from 'react'
import type { FileAttachment } from '../types/file'

interface OcrResultModalProps {
  file: FileAttachment
  onClose: () => void
  onImport: (text: string) => void
}

export default function OcrResultModal({ file, onClose, onImport }: OcrResultModalProps) {
  const [tab, setTab] = useState<'ocr' | 'parse'>('ocr')

  const ocrText = file.ocr_text || '暂无 OCR 结果'
  const parseText = file.parse_text || '暂无解析结果'
  const displayText = tab === 'ocr' ? ocrText : parseText

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{file.file_name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">识别 / 解析结果预览</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setTab('ocr')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'ocr' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            OCR 识别
          </button>
          <button
            onClick={() => setTab('parse')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'parse' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            课件解析
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 rounded-lg p-4 max-h-[50vh] overflow-y-auto">
            {displayText}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            关闭
          </button>
          {displayText !== '暂无 OCR 结果' && displayText !== '暂无解析结果' && (
            <button
              onClick={() => onImport(displayText)}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              导入到笔记
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
