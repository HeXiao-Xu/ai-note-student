import { create } from 'zustand'
import type { Course, CreateCourseRequest, UpdateCourseRequest } from '../types/course'
import * as courseApi from '../api/course'

interface CourseState {
  courses: Course[]
  currentCourseId: number | null
  loading: boolean
  error: string | null

  fetchCourses: () => Promise<void>
  setCurrentCourse: (id: number | null) => void
  createCourse: (data: CreateCourseRequest) => Promise<Course>
  updateCourse: (id: number, data: UpdateCourseRequest) => Promise<Course>
  deleteCourse: (id: number) => Promise<void>
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  currentCourseId: null,
  loading: false,
  error: null,

  fetchCourses: async () => {
    set({ loading: true, error: null })
    try {
      const courses = await courseApi.listCourses()
      set({ courses, loading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取课程失败'
      set({ error: message, loading: false })
    }
  },

  setCurrentCourse: (id) => set({ currentCourseId: id }),

  createCourse: async (data) => {
    const course = await courseApi.createCourse(data)
    set({ courses: [...get().courses, course] })
    return course
  },

  updateCourse: async (id, data) => {
    const course = await courseApi.updateCourse(id, data)
    set({ courses: get().courses.map((c) => (c.id === id ? course : c)) })
    return course
  },

  deleteCourse: async (id) => {
    await courseApi.deleteCourse(id)
    const { currentCourseId, courses } = get()
    set({
      courses: courses.filter((c) => c.id !== id),
      currentCourseId: currentCourseId === id ? null : currentCourseId,
    })
  },
}))
