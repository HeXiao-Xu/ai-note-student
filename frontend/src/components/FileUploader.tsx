import { useRef, useState } from 'react'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
]

const ALLOWED_EXTENSIONS = ['.pdf', '.pptx', '.docx', '.png', '.jpg', '.jpeg']
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

interface FileUploaderProps {
  onUpload: (file: File) => Promise<any>
  disabled?: boolean
}

export default function FileUploader({ onUpload, disabled }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
      return `不支持的文件类型: ${ext}（支持: ${ALLOWED_EXTENSIONS.join(', ')}）`
    }
    if (file.size > MAX_SIZE) {
      return '文件大小不能超过 50MB'
    }
    return null
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError('')

    const file = files[0]
    const err = validateFile(file)
    if (err) {
      setError(err)
      return
    }

    setUploading(true)
    try {
      await onUpload(file)
    } catch {
      setError('上传失败，请重试')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
        } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || uploading}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-indigo-600">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            上传中...
          </div>
        ) : (
          <div>
            <svg className="w-6 h-6 mx-auto mb-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-xs text-slate-500">拖拽文件到此处，或点击上传</p>
            <p className="text-[10px] text-slate-400 mt-1">支持 PDF / PPTX / DOCX / PNG / JPG，最大 50MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}
