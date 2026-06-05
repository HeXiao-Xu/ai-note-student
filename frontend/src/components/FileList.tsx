import type { FileAttachment } from '../types/file'
import { downloadFile, saveBlobAsFile } from '../api/file'

interface FileListProps {
  files: FileAttachment[]
  onDelete: (fileId: number) => void
  onPreview?: (file: FileAttachment) => void
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

export default function FileList({ files, onDelete, onPreview }: FileListProps) {
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
            <span className="text-xs text-slate-400">{formatSize(file.file_size)}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onPreview && file.file_type === 'pdf' && (
              <button
                onClick={() => onPreview(file)}
                className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="预览"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
