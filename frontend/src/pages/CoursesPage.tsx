import { useState } from 'react'
import { useCourseStore } from '../stores/courseStore'

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6']

export default function CoursesPage() {
  const { courses, loading, createCourse, updateCourse, deleteCourse } = useCourseStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])

  const resetForm = () => {
    setName('')
    setDescription('')
    setColor(COLORS[0])
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
    setColor(course.color || COLORS[0])
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('确定删除该课程？课程下的笔记也会被删除。')) {
      await deleteCourse(id)
    }
  }

  if (loading && courses.length === 0) {
    return <div className="p-6 text-gray-400">加载中...</div>
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">课程管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
        >
          新建课程
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    color === c ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
              {editId ? '保存' : '创建'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800">
              取消
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow p-4 flex items-start gap-3">
            <span
              className="w-4 h-4 rounded-full shrink-0 mt-1"
              style={{ backgroundColor: course.color || '#6366f1' }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{course.name}</h3>
              {course.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => handleEdit(course)} className="text-xs text-gray-400 hover:text-indigo-600">编辑</button>
              <button onClick={() => handleDelete(course.id)} className="text-xs text-gray-400 hover:text-red-600">删除</button>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && !showForm && (
        <p className="text-center text-gray-400 mt-10">暂无课程，点击上方按钮创建</p>
      )}
    </div>
  )
}
