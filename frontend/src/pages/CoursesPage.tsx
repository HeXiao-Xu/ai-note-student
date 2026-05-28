import { useState } from 'react'
import { useCourseStore } from '../stores/courseStore'

const COLORS = [
  { value: '#14b8a6', label: 'Teal' },
  { value: '#6366f1', label: 'Indigo' },
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
        <div className="text-slate-500 text-sm">加载中...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-serif">课程管理</h1>
          <p className="text-slate-500 text-sm mt-1">创建和管理你的课程分类</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-slate-950 text-sm font-semibold rounded-lg hover:bg-teal-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          新建课程
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 mb-8 animate-fade-in">
          <h3 className="text-lg font-semibold text-slate-200 mb-5">{editId ? '编辑课程' : '创建课程'}</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">课程名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-colors"
                placeholder="如：数据结构与算法"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-colors resize-none"
                placeholder="课程简介（可选）"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">颜色</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-9 h-9 rounded-xl transition-all ${
                      color === c.value ? 'ring-2 ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: c.value,
                      '--tw-ring-color': color === c.value ? c.value : undefined,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-5 py-2.5 bg-teal-500 text-slate-950 text-sm font-semibold rounded-lg hover:bg-teal-400 transition-colors">
                {editId ? '保存修改' : '创建课程'}
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 text-slate-500 text-sm hover:text-slate-300 transition-colors">
                取消
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {courses.map((course, i) => (
          <div
            key={course.id}
            className="glass-card rounded-xl p-5 group hover:border-slate-600 transition-all animate-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start gap-3.5">
              <div
                className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: course.color || '#14b8a6' }}
              >
                {course.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-200 truncate">{course.name}</h3>
                {course.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700/50">
              <button
                onClick={() => handleEdit(course)}
                className="text-xs text-slate-500 hover:text-teal-400 transition-colors px-2 py-1 rounded hover:bg-slate-800"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(course.id)}
                className="text-xs text-slate-500 hover:text-rose-400 transition-colors px-2 py-1 rounded hover:bg-slate-800"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && !showForm && (
        <div className="text-center mt-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">暂无课程，点击上方按钮创建</p>
        </div>
      )}
    </div>
  )
}
