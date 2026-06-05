import { useEffect, useRef, useCallback } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

interface VditorEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function VditorEditor({ value, onChange, placeholder }: VditorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vditorRef = useRef<Vditor | null>(null)
  const isInternalChange = useRef(false)

  const inputCallback = useCallback((md: string) => {
    isInternalChange.current = true
    onChange(md)
  }, [onChange])

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
        'link',
        'table',
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

  return <div ref={containerRef} />
}
