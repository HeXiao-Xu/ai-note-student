import type { FileAttachment } from '../types/file'
import { downloadFile, saveBlobAsFile } from '../api/file'

interface FileListProps {
  files: FileAttachment[]
  onDelete: (fileId: number) => void
  onOcr?: (fileId: number) => void
  onParse?: (fileId: number) => void
}

const fileIcons: Record<string, string> = {
  pdf: '📄',
  pptx: '📊',
  docx: '📝',
  image: '🖼️',
  other: '📎',
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: '待处理', cls: 'bg-slate-100 text-slate-500' },
    processing: { label: '处理中', cls: 'bg-amber-100 text-amber-600' },
    done: { label: '已完成', cls: 'bg-emerald-100 text-emerald-600' },
    failed: { label: '失败', cls: 'bg-rose-100 text-rose-600' },
  }
  const s = map[status] || map.pending
  return <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${s.cls}`}>{s.label}</span>
}

export default function FileList({ files, onDelete, onOcr, onParse }: FileListProps) {
  const handleDownload = async (file: FileAttachment) => {
    try {
      const { blob, filename } = await downloadFile(file.id)
      saveBlobAsFile(blob, filename || file.file_name)
    } catch {
      alert('下载失败，请重试')
    }
  }

  if (files.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-4">暂无附件</p>
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
        >
          <span className="text-xl shrink-0">{fileIcons[file.file_type] || fileIcons.other}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-700 truncate">{file.file_name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">{formatSize(file.file_size)}</span>
              {statusBadge(file.ocr_status)}
              {statusBadge(file.parse_status)}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onOcr && file.ocr_status !== 'processing' && (
              <button
                onClick={() => onOcr(file.id)}
                className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="OCR识别"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </button>
            )}
            {onParse && file.parse_status !== 'processing' && (
              <button
                onClick={() => onParse(file.id)}
                className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="解析课件"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => handleDownload(file)}
              className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="下载"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
            <button
              onClick={() => { if (confirm('确定删除此附件？')) onDelete(file.id) }}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              title="删除"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
