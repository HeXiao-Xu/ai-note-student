import { useState } from 'react'
import { useCourseStore } from '../stores/courseStore'

const COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#0d9488', label: 'Teal' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ef4444', label: 'Red' },
]

export default function CoursesPage() {
  const { courses, loading, createCourse, updateCourse, deleteCourse } = useCourseStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0].value)

  const resetForm = () => {
    setName('')
    setDescription('')
    setColor(COLORS[0].value)
    setShowForm(false)
    setEditId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editId) {
      await updateCourse(editId, { name, description, color })
    } else {
      await createCourse({ name, description, color })
    }
    resetForm()
  }

  const handleEdit = (course: typeof courses[0]) => {
    setEditId(course.id)
    setName(course.name)
    setDescription(course.description)
    setColor(course.color || COLORS[0].value)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('确定删除该课程？课程下的笔记也会被删除。')) {
      await deleteCourse(id)
    }
  }

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400 text-sm">加载中...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900">课程管理</h1>
          <p className="text-slate-400 text-sm mt-0.5">创建和管理你的课程分类</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          新建课程
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 mb-8 animate-fade-in shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-5">{editId ? '编辑课程' : '创建课程'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">课程名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="如：数据结构与算法"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={2}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                placeholder="课程简介（可选）"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">颜色</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      color === c.value ? 'ring-2 ring-offset-2 ring-offset-white scale-110' : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: c.value,
                      '--tw-ring-color': color === c.value ? c.value : undefined,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                {editId ? '保存修改' : '创建课程'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors">
                取消
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {courses.map((course, i) => (
          <div
            key={course.id}
            className="bg-white border border-slate-200 rounded-xl p-4 group hover:border-slate-300 transition-all card-lift animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: course.color || '#6366f1' }}
              >
                {course.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-800 text-sm truncate">{course.name}</h3>
                {course.description && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{course.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-1 mt-3 pt-2.5 border-t border-slate-100">
              <button
                onClick={() => handleEdit(course)}
                className="text-xs text-slate-400 hover:text-indigo-600 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(course.id)}
                className="text-xs text-slate-400 hover:text-rose-500 transition-colors px-2 py-1 rounded hover:bg-rose-50"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && !showForm && (
        <div className="text-center mt-16">
          <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
          </svg>
          <p className="text-slate-400 text-sm">暂无课程，点击上方按钮创建</p>
        </div>
      )}
    </div>
  )
}
