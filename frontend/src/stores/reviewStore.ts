import { create } from 'zustand'
import type { ReviewItem, ReviewStats, DetailedStats } from '../types/review'
import * as reviewApi from '../api/review'

interface ReviewState {
  todayItems: ReviewItem[]
  stats: ReviewStats | null
  detailedStats: DetailedStats | null
  loading: boolean
  error: string | null

  fetchTodayReviews: () => Promise<void>
  answerReview: (planId: number, quality: number) => Promise<void>
  fetchStats: () => Promise<void>
  fetchDetailedStats: () => Promise<void>
  clear: () => void
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  todayItems: [],
  stats: null,
  detailedStats: null,
  loading: false,
  error: null,

  fetchTodayReviews: async () => {
    set({ loading: true, error: null })
    try {
      const todayItems = await reviewApi.getTodayReviews()
      set({ todayItems, loading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取复习列表失败'
      set({ error: message, loading: false })
    }
  },

  answerReview: async (planId, quality) => {
    await reviewApi.answerReview(planId, quality)
    // Remove answered item from today's list
    set({ todayItems: get().todayItems.filter((item) => item.plan_id !== planId) })
  },

  fetchStats: async () => {
    try {
      const stats = await reviewApi.getReviewStats()
      set({ stats })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取统计失败'
      set({ error: message })
    }
  },

  fetchDetailedStats: async () => {
    set({ loading: true, error: null })
    try {
      const detailedStats = await reviewApi.getDetailedStats()
      set({ detailedStats, loading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取统计失败'
      set({ error: message, loading: false })
    }
  },

  clear: () => set({ todayItems: [], stats: null, detailedStats: null, error: null }),
}))
