import { useEffect, useRef, useCallback, useState } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

interface VditorEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/* ── 插入表格弹窗 ── */
function TablePicker({ onSelect, onClose }: { onSelect: (rows: number, cols: number) => void; onClose: () => void }) {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-5 w-72" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-slate-800 mb-4">插入表格</h3>
        <div className="flex gap-4 mb-4">
          <label className="flex-1">
            <span className="block text-xs text-slate-500 mb-1">行数</span>
            <input type="number" min={1} max={20} value={rows}
              onChange={e => setRows(Math.max(1, Math.min(20, +e.target.value || 1)))}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </label>
          <label className="flex-1">
            <span className="block text-xs text-slate-500 mb-1">列数</span>
            <input type="number" min={1} max={10} value={cols}
              onChange={e => setCols(Math.max(1, Math.min(10, +e.target.value || 1)))}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
          <button onClick={() => { onSelect(rows, cols); onClose() }}
            className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">插入</button>
        </div>
      </div>
    </div>
  )
}

export default function VditorEditor({ value, onChange, placeholder }: VditorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vditorRef = useRef<Vditor | null>(null)
  const isInternalChange = useRef(false)
  const [showTablePicker, setShowTablePicker] = useState(false)

  const inputCallback = useCallback((md: string) => {
    isInternalChange.current = true
    onChange(md)
  }, [onChange])

  /* 触发本地图片选择 */
  const pickImage = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        const vditor = vditorRef.current
        if (vditor) {
          vditor.insertValue(`![${file.name}](${base64})\n`)
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }, [])

  /* 插入表格 */
  const insertTable = useCallback((rows: number, cols: number) => {
    const vditor = vditorRef.current
    if (!vditor) return
    const header = `| ${Array.from({ length: cols }, (_, i) => `列${i + 1}`).join(' | ')} |`
    const sep = `| ${Array.from({ length: cols }, () => '---').join(' | ')} |`
    const body = Array.from({ length: rows - 1 }, () =>
      `| ${Array.from({ length: cols }, () => ' ').join(' | ')} |`
    ).join('\n')
    vditor.insertValue(`\n${header}\n${sep}\n${body}\n`)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const vditor = new Vditor(containerRef.current, {
      mode: 'wysiwyg',
      lang: 'zh_CN',
      placeholder: placeholder || '开始写笔记…',
      height: 'auto',
      minHeight: 400,
      cache: { enable: false },
      cdn: '/vditor-cdn',
      theme: 'classic',
      icon: 'ant',
      toolbar: [
        'headings',
        'bold',
        'italic',
        'strike',
        '|',
        'list',
        'ordered-list',
        'check',
        '|',
        'quote',
        'code',
        'inline-code',
        '|',
        {
          name: 'upload-image',
          tip: '插入图片',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
          click: () => pickImage(),
        },
        {
          name: 'insert-table',
          tip: '插入表格',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H4V4h16v16zM6 10h5v5H6zm7 0h5v5h-5zM6 6h5v2H6zm7 0h5v2h-5z"/></svg>',
          click: () => setShowTablePicker(true),
        },
        '|',
        'undo',
        'redo',
        '|',
        'edit-mode',
        'fullscreen',
      ],
      toolbarConfig: {
        pin: true,
      },
      preview: {
        mode: 'editor',
      },
      after: () => {
        // Set initial value after editor is ready
        if (value) {
          vditor.setValue(value, true)
        }
        vditorRef.current = vditor
      },
      input: inputCallback,
    })

    return () => {
      vditor.destroy()
      vditorRef.current = null
    }
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external value changes (e.g., selecting a different note)
  useEffect(() => {
    if (!vditorRef.current) return
    if (isInternalChange.current) {
      isInternalChange.current = false
      return
    }
    const currentMd = vditorRef.current.getValue()
    if (currentMd !== value) {
      vditorRef.current.setValue(value || '', true)
    }
  }, [value])

  return (
    <>
      <div ref={containerRef} />
      {showTablePicker && (
        <TablePicker
          onSelect={insertTable}
          onClose={() => setShowTablePicker(false)}
        />
      )}
    </>
  )
}
