import { create } from 'zustand'
import type { ExamPoint } from '../types/examPoint'
import * as examPointApi from '../api/examPoint'

interface ExamPointState {
  examPoints: ExamPoint[]
  loading: boolean
  error: string | null

  fetchExamPoints: (noteId: number) => Promise<void>
  analyzeExamPoints: (noteId: number) => Promise<ExamPoint[]>
  clearExamPoints: () => void
}

export const useExamPointStore = create<ExamPointState>((set) => ({
  examPoints: [],
  loading: false,
  error: null,

  fetchExamPoints: async (noteId) => {
    set({ loading: true, error: null })
    try {
      const examPoints = await examPointApi.listExamPoints(noteId)
      set({ examPoints, loading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取考点失败'
      set({ error: message, loading: false })
    }
  },

  analyzeExamPoints: async (noteId) => {
    set({ loading: true, error: null })
    try {
      const result = await examPointApi.analyzeExamPoints(noteId)
      set({ examPoints: result.exam_points, loading: false })
      return result.exam_points
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI分析失败'
      set({ error: message, loading: false })
      throw err
    }
  },

  clearExamPoints: () => set({ examPoints: [], error: null }),
}))
