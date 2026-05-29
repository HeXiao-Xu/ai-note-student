import { create } from 'zustand'
import type { WrongQuestion, AnalysisResponse } from '../types/wrongQuestion'
import * as wqApi from '../api/wrongQuestion'

interface WrongQuestionState {
  items: WrongQuestion[]
  currentQuestion: WrongQuestion | null
  total: number
  page: number
  loading: boolean
  error: string | null

  fetchWrongQuestions: (params?: { page?: number; page_size?: number; error_type?: string }) => Promise<void>
  getWrongQuestion: (id: number) => Promise<void>
  createWrongQuestion: (data: { question: string; answer?: string; my_answer?: string; error_type?: string; note_id?: number | null }) => Promise<WrongQuestion>
  updateWrongQuestion: (id: number, data: { question?: string; answer?: string; my_answer?: string; error_type?: string; mastery?: number }) => Promise<WrongQuestion>
  deleteWrongQuestion: (id: number) => Promise<void>
  uploadImage: (id: number, file: File) => Promise<void>
  analyze: (id: number) => Promise<AnalysisResponse>
  setCurrentQuestion: (q: WrongQuestion | null) => void
  clear: () => void
}

export const useWrongQuestionStore = create<WrongQuestionState>((set, get) => ({
  items: [],
  currentQuestion: null,
  total: 0,
  page: 1,
  loading: false,
  error: null,

  fetchWrongQuestions: async (params) => {
    set({ loading: true, error: null })
    try {
      const result = await wqApi.listWrongQuestions(params)
      set({ items: result.items, total: result.total, page: result.page, loading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取错题失败'
      set({ error: message, loading: false })
    }
  },

  getWrongQuestion: async (id) => {
    try {
      const q = await wqApi.getWrongQuestion(id)
      set({ currentQuestion: q })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取错题失败'
      set({ error: message })
    }
  },

  createWrongQuestion: async (data) => {
    const q = await wqApi.createWrongQuestion(data)
    set({ items: [q, ...get().items], total: get().total + 1 })
    return q
  },

  updateWrongQuestion: async (id, data) => {
    const q = await wqApi.updateWrongQuestion(id, data)
    set({
      items: get().items.map((item) => (item.id === id ? q : item)),
      currentQuestion: get().currentQuestion?.id === id ? q : get().currentQuestion,
    })
    return q
  },

  deleteWrongQuestion: async (id) => {
    await wqApi.deleteWrongQuestion(id)
    set({
      items: get().items.filter((item) => item.id !== id),
      currentQuestion: get().currentQuestion?.id === id ? null : get().currentQuestion,
      total: get().total - 1,
    })
  },

  uploadImage: async (id, file) => {
    const q = await wqApi.uploadWrongQuestionImage(id, file)
    set({
      items: get().items.map((item) => (item.id === id ? q : item)),
      currentQuestion: get().currentQuestion?.id === id ? q : get().currentQuestion,
    })
  },

  analyze: async (id) => {
    const result = await wqApi.analyzeWrongQuestion(id)
    // Refresh the question to get updated analysis field
    await get().getWrongQuestion(id)
    return result
  },

  setCurrentQuestion: (q) => set({ currentQuestion: q }),
  clear: () => set({ items: [], currentQuestion: null, total: 0, error: null }),
}))
