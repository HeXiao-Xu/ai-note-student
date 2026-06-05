import { create } from 'zustand'
import * as qaApi from '../api/qa'
import type { QAConversation, AskResult } from '../types/qa'

interface QAState {
  conversations: QAConversation[]
  currentResult: AskResult | null
  lastQuestion: string
  asking: boolean
  loading: boolean
  error: string | null

  askQuestion: (question: string, courseId?: number) => Promise<void>
  fetchHistory: (courseId?: number) => Promise<void>
  clearResult: () => void
  clearError: () => void
}

export const useQAStore = create<QAState>((set) => ({
  conversations: [],
  currentResult: null,
  lastQuestion: '',
  asking: false,
  loading: false,
  error: null,

  askQuestion: async (question: string, courseId?: number) => {
    set({ asking: true, error: null })
    try {
      const res = await qaApi.askQuestion(question, courseId)
      set({ currentResult: res.data, lastQuestion: question, asking: false })
      // Refresh history
      const historyRes = await qaApi.getHistory(courseId)
      set({ conversations: historyRes.data })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '提问失败'
      set({ error: msg, asking: false })
    }
  },

  fetchHistory: async (courseId?: number) => {
    set({ loading: true })
    try {
      const res = await qaApi.getHistory(courseId)
      set({ conversations: res.data, loading: false })
    } catch {
      set({ conversations: [], loading: false })
    }
  },

  clearResult: () => set({ currentResult: null, lastQuestion: '' }),
  clearError: () => set({ error: null }),
}))
